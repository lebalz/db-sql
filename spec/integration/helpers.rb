# frozen_string_literal: true

module Helpers
  def mail_content
    activation_mail = ActionMailer::Base.deliveries.last
    Nokogiri::HTML(activation_mail.body.raw_source)
  end

  def mail_count
    ActionMailer::Base.deliveries.count
  end

  def activation_link
    mail_content.at_css('#activation-link')[:href]
  end

  def api_activation_link
    link = activation_link
    api_part = link[link.index('/users/')..-1]
    "/api#{api_part}"
  end

  def reset_password_link
    mail_content.at_css('#reset-link')[:href]
  end

  def api_reset_password_link
    link = reset_password_link
    api_part = link[link.index('/users/')..-1]
    "/api#{api_part}"
  end
end
