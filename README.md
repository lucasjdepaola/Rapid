# Rapid
My own text editor, which tackled the main benefits I've gotten out of vim, such as states, motions, bracket/brace/quote completion, command line, and search, with new added features such as backgrounds, being cross-platform, and soon to come a ~/rapidrc source mechanism

The main goal of this editor is to show that with under 1000 lines of code (around 900 at the time of writing this) it is possible to replicate the 1.2m lines-of-code vim, keeping the best features, omitting the rest. I finished what I consider the main features of vim in roughly 3 days.

Use this editor via [this link](https://lucasdepaola.com/Rapid)

![Editor footage](https://i.imgur.com/NZlaRrQ.jpeg)

## Scope file-finding functionality (toggle Ctrl-f to access)
![Scope footage](https://i.imgur.com/QB47BBH.jpeg)

## Game functionality
To practice relative line number jumps
![Game footage](https://i.imgur.com/fPq1g88.gif)

## Intention and reasoning behind this project

With no feasible way to access vim-like motions in the browser, I decided to implement my own editor, with my own configuration baked in. Mystified at editors being megabytes (sometimes even gigabytes), I wanted to keep things minimal, and manually written. Now being able to use my editor (which can access the user file system) from anywhere, I feel that my goal is achieved. The next step is implementing a game command (now having the intuitive understanding and access to the live editor text) that will allow for the fastest ways to maneuver text to come out on top. This game command should be out within the next week or two.

When trying to decipher vims source code, it's nearly impossible to find code that is important to the project without recursively clicking through countless directories. With this project, you can find code that is crucial to the projects infrastructure, all in one file. Anything shown on the editor is likely within this one file, making it easy to learn what goes on under the hood.
