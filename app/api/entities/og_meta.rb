module Entities
    class OGMeta < Grape::Entity
      with_options(expose_nil: false) do
        expose :image
        expose :site_name
        expose :title
        expose :description
      end
    end
  end
  