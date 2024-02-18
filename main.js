var nav_button = [
    {"name" : "home" ,  "class_val" : "active" },
    {"name" : "aboutMe"  , "class_val" : "normal" },
    {"name" : "blog"  , "class_val" : "normal"},
    {"name" : "contact"  , "class_val" : "normal"}
]


export function WebHeader(active) {

    var header_html=`
    <div class="topnav">
        <a id="home" href="../home/home.html">Home</a>
        <a id="aboutMe" href="../aboutme/aboutme.html">About Me</a>
        <a id="blog" href="../blog/list.html">Blog</a>
        <a id="contact" href="../contact/contact.html">Contact Me</a>
    </div>
    `
    
    var tempheadContainer = document.createElement('div')
    
    tempheadContainer.innerHTML = header_html
    
    const headerElement = tempheadContainer.firstElementChild;

    for(var entry =0 ; entry < nav_button.length; entry++){

        if(nav_button[entry].name == active){

            nav_button[entry].class_val = "active"

        }else{

            nav_button[entry].class_val = "normal"
        }
    }

    function headerBar() {

        for (var entry = 0; entry < nav_button.length; entry++) {

            var link = nav_button[entry].name;
            
            var linkElement = tempheadContainer.querySelector(`#${link}`);

            if (linkElement) {

                linkElement.className = nav_button[entry].class_val;

            } else {

                console.error("Button with id '" + link + "' not found");
            }
            console.log(link , ":" , linkElement);
        }

        document.getElementsByClassName('page_contain')[0].appendChild(tempheadContainer.firstElementChild);
    }

    window.addEventListener('load', headerBar);
}

// Call the function to initialize the header generation
