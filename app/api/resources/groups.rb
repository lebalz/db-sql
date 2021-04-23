# frozen_string_literal: true

module Resources
  class Groups < Grape::API
    before do
      load_current_group if params.key?(:id)
    end
    helpers do
      def load_current_group
        group = policy_scope(Group).includes(:group_members, :db_servers,
                                             :users).find(params[:id])

        authorize group, :show?

        @current_group = group
      end

      attr_reader :current_group

      def crypto_key
        has_key = request.headers.key?('Crypto-Key')
        error!('Crypto-Key is required', 400) unless has_key

        request.headers['Crypto-Key']
      end
    end
    resource :groups do
      desc 'Get public groups'
      params do
        optional(:limit, type: Integer, default: -1,
                         desc: 'maximal number of returned groups, -1 returns all groups')
        optional(:offset, type: Integer,  default: 0,
                          desc: 'offset of returned groups')
        optional(:order, type: Symbol, values: %i[asc desc], default: :asc, desc: 'sort order')
      end
      resource :public do
        get do
          authorize Group, :index?

          public_groups = Group.public_available.where.not(
            'id in (?)', current_user.groups.select(:id)
          ).includes(:group_members, :db_servers, :users)

          if (params[:limit] || 0) < 0
            return present(public_groups, with: Entities::Group,
                                          user: current_user)
          end

          present(
            public_groups
              .reorder(name: params[:order])
              .offset(params[:offset])
              .limit(params[:limit]),
            with: Entities::Group,
            user: current_user
          )
        end

        desc 'Get number of available groups'
        route_setting :auth, disabled: true
        get :counts do
          authorize Group, :index?

          { count: Group.public_available.count }
        end
      end

      desc 'Create a new group'
      params do
        requires(:name, type: String, desc: 'Name')
        optional(:description, type: String, default: '',
                               desc: 'description or purpose of the group')
        optional(:is_private, type: Boolean, default: true,
                              desc: 'is a private group')
      end
      post do
        authorize Group, :create?

        new_group = nil
        ActiveRecord::Base.transaction do
          new_group = Group.create(
            name: params[:name],
            description: params[:description],
            is_private: params[:is_private]
          )
          new_group.add_user(
            user: current_user,
            group_key: Group.random_crypto_key,
            is_admin: true
          )
        end
        present(new_group, with: Entities::Group, user: current_user)
      end

      route_param :id, type: String, desc: 'Group ID' do
        desc 'Get a specific group'
        get do
          authorize current_group, :show?

          current_group.update_outdated_members(
            group_key: current_group.crypto_key(current_user,
                                                current_user.private_key(crypto_key))
          )

          present(current_group, with: Entities::Group, user: current_user)
        end

        desc 'Delete a group'
        delete do
          authorize current_group, :destroy?

          begin
            current_group.destroy
          rescue StandardError => e
            error!("An error occured during deletion: #{e.message}", 403)
          end
          status :no_content
        end

        desc 'force the current group to generate a new crypto key. All db server passwords of this group will be lost!'
        post :generate_new_crypto_key do
          authorize current_group, :recrypt?

          current_group.force_new_crypto_key!
          current_group.reload
          present(current_group, with: Entities::Group, user: current_user)
        end

        desc 'update a group'
        params do
          requires :data, type: Hash do
            optional(:is_private, type: Boolean, desc: 'is_private')
            optional(:name, type: String, desc: 'name')
            optional(:description, type: String, desc: 'name')
          end
        end
        put do
          authorize current_group, :update?

          change = ActionController::Parameters.new(params[:data])
          privacy_changed = change[:is_private] != current_group.private?

          ActiveRecord::Base.transaction do

            # get the current crypto key when privacy changed to public
            if privacy_changed && !change[:is_private]
              old_crypto_key = current_group.crypto_key(
                current_user, current_user.private_key(crypto_key)
              )
            end

            # make the updates to the group
            current_group.update!(
              change.permit(
                :is_private,
                :name,
                :description
              )
            )

            # change the groups crypto key
            if privacy_changed
              if change[:is_private]
                current_group.recrypt!(
                  old_crypto_key: current_group.public_crypto_key,
                  new_crypto_key: Group.random_crypto_key
                )
              else
                current_group.recrypt!(
                  old_crypto_key: old_crypto_key,
                  new_crypto_key: current_group.public_crypto_key
                )
              end
            end
          end

          present(current_group, with: Entities::Group, user: current_user)
        end

        resource :members do
          desc 'add a member'
          params do
            requires(:user_id, type: String, desc: 'user id of the new member')
          end
          post do
            authorize current_group, :add_member?

            new_member = User.find(params[:user_id])
            group_member = current_group.add_user(
              user: new_member,
              group_key: current_group.crypto_key(
                current_user,
                current_user.private_key(crypto_key)
              )
            )
            present(group_member, with: Entities::GroupMember)
          end

          route_param :user_id, type: String, desc: 'Group ID' do
            desc 'remove member'
            patch do
              is_self = current_user.id == params[:user_id]
              if is_self
                authorize current_group, :leave?
              else
                authorize current_group, :remove_member?
              end

              group_member = current_group.group_members.find_by(user_id: params[:user_id])
              error!('User not found', 302) unless group_member

              group_member.destroy
              status :no_content
            end

            desc 'Change permission for user'
            params do
              requires(:is_admin, type: Boolean, desc: 'is admin')
            end
            post :set_admin_permission do
              authorize current_group, :change_member_permission?

              if current_user.id == params[:user_id]
                error!(
                  'Admin can not revoke it\'s admin rights User not found', 302
                )
              end

              group_member = current_group.group_members.find_by(user_id: params[:user_id])
              error!('User not found', 302) unless group_member

              group_member.update!(
                is_admin: params[:is_admin]
              )

              present(group_member, with: Entities::GroupMember)
            end
          end

        end

        desc 'Join group'
        patch :join do
          authorize current_group, :join?

          new_member = current_user
          if current_group.member? new_member
            status :no_content
            return
          end
          group_member = current_group.add_user(
            user: new_member,
            group_key: current_group.crypto_key(
              new_member,
              new_member.private_key(crypto_key)
            )
          )
          status :no_content
        end

        desc 'Leave public group'
        patch :leave do
          authorize current_group, :leave?

          current_group.remove_user(user: current_user)
        end

      end
    end
  end
end
