#!/bin/bash

if [[ $VERCEL_GIT_COMMIT_REF == "main"  ]] ; then 
  echo "Production build (Mainnet)"
  yarn build:mainnet
else # should be develop branch
  echo "Preview Build (Testnet)"
  yarn build:testnet
fi