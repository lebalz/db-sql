# frozen_string_literal: true

module Resources
  class Status < Grape::API
    route_setting :auth, disabled: true
    get :commit do

      commit, short_sha = if Rails.env.production? || Rails.env.staging?
                            sha = ENV.fetch('GIT_REV') { File.read(Rails.root.join('REVISION')) }
                            short = sha[0...7]
                            [sha, short]
                          else
                            sha = `git rev-parse HEAD`.strip
                            short = `git rev-parse --short HEAD`.strip
                            [sha, short]
                          end

      @link = "https://github.com/lebalz/db-sql/workspace/commit/#{commit}"
      @commit = short_sha
      { commit: @commit, link: @link }
    end
  end
end
