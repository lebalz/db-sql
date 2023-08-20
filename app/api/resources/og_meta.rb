# frozen_string_literal: true
# require 'nokogiri'
require 'http'

module Resources
  class OGMeta < Grape::API
    resource :og_meta do
      desc 'Get og:image from url'
      post do
        url = params[:url]
        _meta = Rails.cache.fetch("#{url}", expires_in: 2.hours) do
          p "Fetching #{url}"
          response = HTTP.get(url)
          if response.status != 200
            return error!('Url not found', 404)
          end
          doc = Nokogiri::HTML(response.body.to_s)
          meta = {}
          ['og:image', 'og:site_name', 'og:title', 'og:description'].each do |m|
            prop = doc.css("meta[property='#{m}']")
            if !prop.empty?
              meta[m[3..].to_sym] = prop.first.attributes["content"].content
            end
          end
          meta
        end

        present(
          _meta,
          with: Entities::OGMeta
        )
      end
    end
  end
end
