# frozen_string_literal: true

class ActivationMailer < ApplicationMailer

  def activate_account(user)
    @user = user
    mail(
      to: @user.email,
      subject: "DB SQL Account Activation",
      content_type: "text/html"
    )
  end
end
