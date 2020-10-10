#!/usr/bin/env bash
rsync -av . beta/ --exclude beta/ --exclude epc/ --exclude _epc/ --exclude ".*"
