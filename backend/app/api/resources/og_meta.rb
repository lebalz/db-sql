# frozen_string_literal: true

# require 'nokogiri'
require 'http'

module Resources
  class OgMeta < Grape::API
    resource :og_meta do
      desc 'Get og:image from url'
      post do
        url = params[:url]
        _meta = Rails.cache.fetch(url.to_s, expires_in: 2.hours) do
          p "Fetching #{url}"
          response = HTTP.get(url)
          return error!('Url not found', 404) if response.status != 200

          doc = Nokogiri::HTML(response.body.to_s)
          meta = {}
          ['og:image', 'og:site_name', 'og:title', 'og:description'].each do |m|
            prop = doc.css("meta[property='#{m}']")
            unless prop.empty?
              meta[m[3..].to_sym] = prop.first.attributes["content"].content
            end
          end
          meta
        end

        present(
          _meta,
          with: Entities::OgMeta
        )
      end
    end
  end
end
