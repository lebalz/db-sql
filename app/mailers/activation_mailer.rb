# frozen_string_literal: true

class ActivationMailer < ApplicationMailer
  default from: 'no-reply@db-sql.ch'

  def activate_account(user)
    @user = user
    mail(
      to: @user.email,
      subject: "DB SQL Account Activation"
    )
  end
end
