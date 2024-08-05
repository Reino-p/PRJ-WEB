//==========================Javascript file for functionality==========================

//==========================Back to top scroll functionality==========================

window.onscroll = function() {scrollFunction()};

function scrollFunction() {
    const button = document.getElementById("back-to-top");
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        button.style.display = "block";
    } else {
        button.style.display = "none";
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


//==========================function==========================

