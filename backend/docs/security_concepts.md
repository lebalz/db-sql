# Securityconcepts of db-sql

## How does db-sql store db credentials on the server?

The backend is responsible to establish the database connections. This leads to the necissity of storing sensitive credentials on the server. To ensure no data breaches happens in case of an unauthorized server access, passwords are encrypted with a key only known by the client. Concrete a HMAC-SHA256 key with 20'000 iterations and a unique salt is generated from the password of the users db-sql login ([user.rb#crypto_key](/app/models/user.rb)). It is stored client-side in the local storage of the browser.

When creating a new database server, the password is encrypted with AES-256-CBC where the crypto_key fungates as the cipher key.

Foreach query to this database server, the caller must provide the crypto_key to decrypt the database server password for the connection.
