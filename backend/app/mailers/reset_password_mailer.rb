# frozen_string_literal: true

class ResetPasswordMailer < ApplicationMailer
  def reset(user)
    @user = user
    mail(
      to: @user.email,
      subject: "Reset DB SQL Password"
    )
  end
end
