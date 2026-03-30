var nav_button = [
    {"name" : "home" ,  "class_val" : "active" },
    {"name" : "aboutMe"  , "class_val" : "normal" },
    {"name" : "blog"  , "class_val" : "normal"},
    {"name" : "contact"  , "class_val" : "normal"}
]

export var header_html=`
<div class="topnav">
    <a id="home" href="/home/home.html">Home</a>
    <a id="aboutMe" href="/aboutme/aboutme.html">About Me</a>
    <a id="blog" href="/blog/list.html">Blog</a>
    <a id="contact" href="/contact/contact.html">Contact Me</a>
</div>
`


export function WebHeader(active) {
    var tempheadContainer = document.createElement('div');
    tempheadContainer.innerHTML = header_html;

    for (var entry = 0; entry < nav_button.length; entry++) {
        if (nav_button[entry].name == active) {
            nav_button[entry].class_val = "active";
        } else {
            nav_button[entry].class_val = "normal";
        }
    }

    function headerBar() {
        var container = document.getElementsByClassName('page_contain')[0];
        if (!container) return;

        // If a static nav already exists on the page, only update active states and skip insertion.
        var existingTopnav = container.querySelector('.topnav');
        if (existingTopnav) {
            for (var i = 0; i < nav_button.length; i++) {
                var existingLink = existingTopnav.querySelector(`#${nav_button[i].name}`);
                if (existingLink) {
                    existingLink.className = nav_button[i].class_val;
                }
            }
            return;
        }

        for (var entry = 0; entry < nav_button.length; entry++) {
            var link = nav_button[entry].name;
            var linkElement = tempheadContainer.querySelector(`#${link}`);

            if (linkElement) {
                linkElement.className = nav_button[entry].class_val;
            } else {
                console.error("Button with id '" + link + "' not found");
            }
        }
        container.insertBefore(tempheadContainer.firstElementChild, container.firstChild);
    }

    window.addEventListener('load', headerBar);
}
