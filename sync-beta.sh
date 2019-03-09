#!/usr/bin/env bash
#
# Copies all folders except beta, epc, the epc git submodule and hidden folders to /beta
# Use this to sync up beta with the current master.
rsync -av . beta/ --exclude beta/ --exclude epc/ --exclude _epc/ --exclude ".*"
