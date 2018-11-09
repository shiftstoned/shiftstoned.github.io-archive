#  Merging with shiftstoned.com

The process I have been using to merge changes from the Eternal Power Calculator
repo to the shiftstoned repo isn't a very good one, but I'm documenting it here
so there is no mystery for anyone else who will be doing this in the future.

First, I update my fork of the shiftstoned repo
(`https://github.com/shiftstoned/shiftstoned.github.io.git`), then use
`git log` and `git diff` in the `epc/` directory of that repo to find any changes
to `index.html` or `epc.css` that aren't yet in the epc repo.  I merge
those changes back into the epc repo.

Then I generate the minified Javascript using `./generate.sh` and isolate
all the files intended for distribution to shiftstoned with `./dist.sh`.
Then I can copy all the distribution files from the `dist/` subdirectory
to the shiftstoned repo fork.  (i.e. `cp dist/* ../shiftstoned.github.io/epc`)

At this point I verify that I haven't clobbered anything on shiftstoned by
doing a `git diff` in `shiftstoned.github.io/epc`.  If everything looks good,
I commit and then use that commit to send a pull request to the live
shiftstoned site.

This process isn't ideal.  It is documented here as an explanation, not
as a recommendation.
