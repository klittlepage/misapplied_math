# Misapplied Math Blog

## Hacking

See [https://github.com/octopress/octopress](Octopress) for documentation. Bundler is in use so all commands should be prefixed with ```bundle exec```

## Configuration

The following should be set in a .env file. Given that octopress doesn't use dotenv, the environment should be sourced as well.

```
export AWS_S3_STAGING_BUCKET=staging-bucket
export AWS_S3_DEPLOYMENT_BUCKET=production-bucket
export AWS_ACCESS_KEY=public-aws-key
export AWS_SECRET_KEY=secret-aws-key
```

## Building
All dependencies are handled by bundler. However, make sure that you have nodejs installed for asset compilation.

### Staging
```
rm -rf .asset-cache .code-highlighter-cache
bundle exec jekyll build
bundle exec octopress deploy --config _staging.yml
```

### Production
```
rm -rf .asset-cache .code-highlighter-cache
JEKYLL_ENV=production bundle exec jekyll build
bundle exec octopress deploy --config _deploy.yml
```
