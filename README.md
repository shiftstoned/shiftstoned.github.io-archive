This repository contains outdated versions of site assets being stored for archival purposes. 

To access the most recent repository for Shiftstoned, please visit https://github.com/PapaCapricorn/shiftstoned

---


# Shiftstoned.com
Player resources for Eternal card game

This is the source code for the website https://www.shiftstoned.com/. If you are interested in contributing improvements to the site, thanks! We would love to hear from you. Please message @shiftstoned on twitter for direct queries.

## Beta

To access the beta version of the site, which has experiments and features undergoing testing, you can visit shiftstoned.com/beta. Stuff here may be unstable or not work very well, so we recommend visiting it only for development purposes. This is simply a modified version of the normal site in a directory with no public links to it.

## Development Guide

Right now, Shiftstoned serves static HTML via Github pages. One day we may add a back-end, but for now we prefer to keep it simple. The exception is the eternal power calculator (https://www.shiftstoned.com/epc/), which is maintained in a separate repository (https://github.com/matt-kimball/epc).

### Upgrading EPC

Currently EPC feature changes happen in the EPC repo, but PapaCapricorn (our main content producer and site owner) updates individual cards by editing epc's index.html (/epc/index.html). This keeps the card updating process simple, but makes upgrading EPC slightly trickier than it would be otherwise. It's a two step process: merge in the changes to shiftstoned's version of epc/index.html, then build EPC and copy over the files. You can also reverse this process, but it's more error-prone.

1. Update EPC's index.html. Copy shiftstoned's /epc/index.html (make sure you have pulled the most recent commit) over to the EPC repo, on a clean branch (probably master). If there are changes, fix conflicts and make a PR and get it merged.
2. There are two options for handling this step. The first is to manually build EPC (see instructions in EPC's README), then copy/paste the built files into shiftstoned's /epc directory. If you are adding a new beta version, just copy paste the built files into /beta/epc. The second way it to run a bash script, either `upgrade-epc.sh` or `upgrade-epc-beta.sh`. You will need `git` and `npm` available, as well as any other build dependencies of EPC. This will download either the beta or master version of epc as a [git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules), build it, and automatically copy over the files. You will still need to use git to commit the changes, and please take this opportunity to do a final check to make sure everything worked properly (double check that you didn't clobber changes to the index.html, especially). If you push to master, you have deployed to production, so be careful.
