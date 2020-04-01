# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: 'no-reply@db-sql.ch'
  layout 'mailer'
end
