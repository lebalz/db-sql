require 'rails_helper'

RSpec.describe API, type: :feature do
  before :all do
    User.create!(
      email: 'admin@user.ch',
      password: 'asdfasdf',
      password_confirmation: 'asdfasdf',
      role: 'admin',
      activated_at: DateTime.now
    )
  end

  it 'allows login', js: true do
    visit '/login'
    fill_in 'email', with: 'admin@user.ch'
    fill_in 'password-input', with: 'asdfasdf'
    click_button 'Login'
    sleep 10

    expect(page).to have_content('YOUR DB SERVERS')
  end
end
