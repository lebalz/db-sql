# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: 'gbsl_fs-info@edubern365.ch'
  layout 'mailer'
end
