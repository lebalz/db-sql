class ActivationMailerPreview < ActionMailer::Preview

  def activate_account
    ActivationMailer.activate_account(User.last)
  end
end