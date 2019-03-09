# Shiftstoned.com
Player resources for Eternal card game

This is the source code for the website https://www.shiftstoned.com/. If you are interested in contributing improvements to the site, thanks! We would love to hear from you. Please message @shiftstoned on twitter for direct queries.

## Beta

To access the beta version of the site, which has experiments and features undergoing testing, you can visit shiftstoned.com/beta. Stuff here may be unstable or not work very well, so we recommend visiting it only for development purposes. This is simply a modified version of the normal site in a directory with no public links to it. 

## Development Guide

Shiftstoned is, by design, a very simple site that serves static HTML via Github pages. One day we may add a back-end, but for now we prefer to keep it simple. The exception is the eternal power calculator (https://www.shiftstoned.com/epc/), which is maintained in a separate repository (https://github.com/matt-kimball/epc). 

### Upgrading EPC

Upgrading the EPC to a newer version is easy if you already know how to build the EPC. Please see the docs in that repo for details. There are two ways to go about it. The first is to manually copy/paste the built files into the /epc directory. If you are adding a new beta version, just copy paste the built files into /beta/epc. The second way it to run a bash script, either `upgrade-epc.sh` or `upgrade-epc-beta.sh`. You will need `git` and `npm` available, as well as any other build dependencies of EPC. This will download either the beta or master version of epc as a [git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules), build it, and automatically copy over the files. You will still need to use git to commit the changes, and please take this opportunity to do a final check to make sure everything worked properly. If you push to master, you have deployed to production, so be careful. 
