# MisappliedMath

This repository contains the source code for the Misapplied Math Blog (aka [https://www.klittlepage.com](https://www.klittlepage.com)). The misapplied stack consists of:

* [Middleman](https://middlemanapp.com/) - static site generation
* [Webpack](https://webpack.github.io/) - static asset build pipeline
* [Katex](https://khan.github.io/KaTeX/) - math typesetting
* [Gulp](http://gulpjs.com/) - task runner for anything not covered by Webpack
* [Critical](https://github.com/addyosmani/critical) - critical path CSS extraction tool
* [npm](https://www.npmjs.com/) - javascript dependency management

# Initial Setup

## Dependencies

The following dependencies must be met before attempting a build:

* [ruby 2.3.3](https://www.ruby-lang.org)
* [Bundler](http://bundler.io/)
* [Nokogiri](http://www.nokogiri.org/tutorials/installing_nokogiri.html). Note that the nokogiri gem will only build if its native dependencies are met first.
* [npm](https://www.npmjs.com/)
* [Gulp](http://gulpjs.com/)

## Environment

At a minimum ```MISAPPLIED_HOST=https://www.klittlepage.com``` must be defined in either the environment or a ```.env``` file. For deployment, the following variables must be defined as well:

* ```AWS_S3_STAGING_BUCKET```
* ```AWS_S3_DEPLOYMENT_BUCKET```
* ```AWS_ACCESS_KEY```
* ```AWS_SECRET_KEY```

## Install

```
Public: git clone https://github.com/klittlepage/misapplied_math.git
Private: git clone git@github.com:klittlepage/misapplied_math.git
cd misapplied_math
bundle install
npm install
```

# Build

Build the site by running ```bundle exec middleman build```. Site contents will be rendered into the ```build``` directory.

# Development

## Live Reloading

To build the site continuously while live reloading assets, run ```bundle exec middleman serve```.

## Updating critical path CSS

Running ```gulp critical``` will render critical path css into the ```build_critical``` directory. The site index and a random blog article are targeted for critical path css extraction. The resulting css should be placed in ```source/partials/_critical_path_site_css.erb``` and ```source/partials/_critical_path_blog_css.erb```, respectively. This task may only be run after a successful build as described in the section on [building](#Building), and after critical path css is updated, the build must be run again. 

This process could be cleaned up by allowing critical to inline the generated css directly. This option was not chosen given the runtime of critical - generating css for a few representative pages and templating it into others is orders of magnitude faster than running critical on every page, as would be required for automatic inlining.

## Linting

Run ```rubocop``` to check ruby code before committing.

# Deployment

Make sure that the environmental variables defined in the [environment](#Environment) section are set.

The default ```rake``` task deploys to a staging environment. To deploy to production, run:

```rake deploy[production]```

By default ```Cache-Control``` headers are set for all build assets, including html. The expiry times can be configured in the ```deploy``` task in ```Rakefile```, but in general should not be changed.
