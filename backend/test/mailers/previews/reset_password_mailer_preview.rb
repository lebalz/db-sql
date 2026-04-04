class ResetPasswordMailerPreview < ActionMailer::Preview

  def reset
    ResetPasswordMailer.reset(User.last)
  end
end