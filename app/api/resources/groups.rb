# frozen_string_literal: true

module Resources
  class Groups < Grape::API
    before do
      load_current_group if params.key?(:id)
    end
    helpers do
      def load_current_group
        group = Group.includes(:group_members, :db_servers, :users).find(params[:id])

        error!('Group not found', 302) unless group
        unless group.public? || group.member?(current_user)
          error!('You are not a member of this group', 401)
        end

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
      desc 'Get all groups of the current user'
      get do
        present(
          current_user.groups.includes(:group_members, :db_servers, :users),
          with: Entities::Group
        )
      end

      desc 'Get public groups, by default 20 with no offset'
      params do
        optional(:limit, type: Integer, default: 20, desc: 'maximal number of returned groups')
        optional(:offset, type: Integer,  default: 0, desc: 'offset of returned groups')
      end
      route_setting :auth, disabled: true
      get :public do
        present(
          Group.public_available
            .includes(:group_members, :db_servers, :users)
            .offset(params[:offset])
            .limit(params[:limit]),
          with: Entities::Group
        )
      end

      desc 'Get number of available groups'
      route_setting :auth, disabled: true
      get :counts do
        { count: Group.public_available.count }
      end

      desc 'Create a new group'
      params do
        requires(:name, type: String, desc: 'Name')
        optional(:is_private, type: Boolean, default: true, desc: 'is a private group')
      end
      post do
        new_group = nil
        ActiveRecord::Base.transaction do
          new_group = Group.create(
            name: params[:name],
            is_private: params[:is_private]
          )
          new_group.add_user(
            user: current_user,
            group_key: Group.random_crypto_key,
            is_admin: true
          )
        end
        present(new_group, with: Entities::Group)
      end

      route_param :id, type: String, desc: 'Group ID' do
        desc 'Get a specific group'
        get do
          present(current_group, with: Entities::Group)
        end

        desc 'Delete a group'
        delete do
          unless current_group.admin?(current_user)
            error!('No permission to delete this group', 302)
          end

          begin
            current_group.destroy
          rescue StandardError => e
            error!("An error occured during deletion: #{e.message}", 403)
          end
          status :no_content
        end

        desc 'update a group'
        params do
          requires :data, type: Hash do
            optional(:is_private, type: Boolean, desc: 'is_private')
            optional(:name, type: String, desc: 'name')
          end
        end
        put do
          unless current_group.admin?(current_user)
            error!('No permission to update this group', 302)
          end

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
                :name
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

          present(current_group, with: Entities::Group)
        end

        resource :members do
          desc 'add a member'
          params do
            requires(:user_id, type: String, desc: 'user id of the new member')
          end
          post do
            unless current_group.admin?(current_user)
              error!('No permission to remove members from this group', 302)
            end

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
            delete do
              unless current_group.admin?(current_user)
                error!('No permission to remove members from this group', 302)
              end
              error!('Admin can not remove itself', 302) if current_user.id == params[:user_id]

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
              unless current_group.admin?(current_user)
                error!('No permission to delete this group', 302)
              end
              error!('Admin can not revoke it\'s admin rights User not found', 302) if current_user.id == params[:user_id]

              group_member = current_group.group_members.find_by(user_id: params[:user_id])
              error!('User not found', 302) unless group_member

              group_member.update!(
                is_admin: params[:is_admin]
              )
              
              present(group_member, with: Entities::GroupMember)
            end
          end

        end

      end
    end
  end
end
