## How AI assisted development
AI assisted in our development of this application through developing the foundation of the application(20250316-init.txt & 20250317-meta_init.txt) initially.

The initial prompt was further refined through use of meta-prompting in order to explore potential ways to plan out certain parts of the application that we haven't looked into yet.

After the initial prompts generated the baseline of the application, we started to use the prompts to help debug some problematic issues(20250320-debug.txt).

Although initially, AI could help smooth out some hindering bugs that we first encountered, it became evident that there were some issues that were better resolved without the use of AI.

## Challenges faced & solutions
During the debugging phase of our lab(after initial generation and ironing out bugs that prevented the application from starting up), we agreed that debugging manually was more efficient than having to write another prompt again and again in order to fix the issues, since the AI could change some code but potentially stil not fix the issue that was present.

Although debugging manually was used, usage of AI prompts to help debug(notably troubleshooting issues on subjects we might not thoroughly understand such as how an API works exactly or specifying what was needed to make the application work) was generally more helpful further down the line when the codebase became larger.

There were other issues such as having to clean up places where the AI had an idea going, but did not end up finishing it(anticipating that it would have been implemented in the future). Due to this issue, human review of the code would have been more appropriate, as having the AI scan for issues such as this would be harder(and could have tried to fix the code instead, such that it incorporated its feature, which could potentially make the code more messy to read if it failed to finish its code).

Keeping track of the issues themselves were a problem at the beginning, but through the use of Github, we were able to effectively track what problems needed to be addressed, and which to leave for later. (P.S: This sentence might not need to be part of the reflection.)

## AI's impact on team collaboration
AI impacted team collaboration by allowing the other team member to view the prompts that one another has made, which allows seeing the ideas they were going for when making a prompt. In our scenario however, only one person has made prompts(which even though means that one person is generating, it allows the other one to critque the prompts and more easily keep track of the progress of the application, while fixing potential problems that arise from the result).

AI's effectiveness however, dwindles the more the project is being developed, due to ideas being brought into fruition, which leads to AI usage dropping, and being more limited towards just debugging issues that come up every now and then.

Note: Add more to the reflection. There are some parts that I think can be more better explained. Its spaced out to make each sentence more clearer(some might seem be run-on sentences.)