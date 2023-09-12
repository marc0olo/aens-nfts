#!/bin/bash

if [[ $VERCEL_GIT_COMMIT_REF == "master"  ]] ; then 
  echo "Production build (Mainnet)"
  yarn build:mainnet
elif [[ $VERCEL_GIT_COMMIT_REF == "develop"  ]] ; then 
  echo "Preview Build (Testnet)"
  yarn build:testnet
else
  echo "Skipping Build"
  # do nothing
fi