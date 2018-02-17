#!/bin/bash
set -x
if [ $TRAVIS_BRANCH == 'master' ] ; then
    # Initialize a new git repo in _site, and push it to our server.
    cd dir
    git init
        
    git remote add deploy "deploy@165.227.244.57:/var/www/dynamicApi"
    git config user.name "Travis CI"
    git config user.email "lma+travisCI@gmail.com"
    
    git add .
    git commit -m "Deploy"
    git push --force deploy master
else
    echo "Not deploying, since this branch isn't master."
fi
