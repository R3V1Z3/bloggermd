# BloggerMD
Super simple Markdown converter (renderer) specifically for use with Blogger.com. The bloggermd.js script automatically grabs post content and converts Markdown content to HTML. The script is designed to be as easy as possible to use, just insert a link to the script in the Blogger theme's head tag. Instructions below.

## How to use it
Easy.
- In your dashboard, go to **Layout**.
- Click *Add a Gadget*.
- Find and click the *HTML/JavaScript* Gadget.
- Untick the *Show HTML/JavaScript* option.
- Leave the **Title** entry blank.
- For the **Content**, paste in the following: `<script src='https://cdn.jsdelivr.net/gh/Ugotsta/bloggermd@master/bloggermd.min.js' />`
- Click *Save*.

## Caveats
This library is designed to be simple like Snarkdown.js but built for Blogger. So Markdown support isn't as extensive as mature libraries like Markdown-it.js. It's also not as fast as Snarkdown since it uses a few more regex passes. But it's still fast and smaller than Markdown-it.

## Examples
The script is being used in a few active blogs.
- MovesDB: https://movesdb.blogspot.com/
- Visualizations: http://viz.ugotsta.com/
