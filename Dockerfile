# Builder stage
FROM lebalz/rails-full-builder:latest AS Builder

# Final stage
FROM lebalz/rails-full-final:latest

# Additional setup your production image requires, e.g. adding more Alpine packages
# RUN apk add ....

USER app

# Execute the Procfile
CMD ["bin/run-dev.sh"]