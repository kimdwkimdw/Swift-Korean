; "use strict";

(function ($) {
    $(document).ready(function () {
        var path = getCurrentPath();
        if (path == undefined || path == "404") {
            return;
        }

        getSections();

        for (var i in pages) {
            getDropdown(pages[i]);
            getSideNavigation(pages[i]);
        }

        var total = getTotalPages();

        getSha(total);

        $("a.internal").click(function () {
            //getPushState($(this));
            getScrollTo($(this));
            return false;
        });
    });

    //  Gets the latest commit key.
    var getSha = function (total) {
        var url = gitHubApiCacheUrl + "/repos/lean-tra/Swift-Korean/git/refs/heads/master";
        $.ajax({
                type: "GET",
                url: url,
                dataType: "json",
                headers: { "Authorization": "token " + authKey }
            })
            .done(function(data) {
                var sha = data.object.sha;

                $.each(pages, function(i, page) {
                    if (page.page == "index" || page.page == "contributor") {
                        getMarkdown(page, page.page, total, sha);
                    } else {
                        $.each(page.children, function(j, p) {
                            getMarkdown(p, page.page, total, sha);
                        });
                    }
                });
            });
    };


    // Gets the current path.
    var getCurrentPath = function () {
        var path = $.url().attr("path");
        if (path == undefined || path == "/") {
            path = "index";
            var hash = $.url().attr("fragment");
            if (hash != undefined && hash.length) {
                path = hash;
                if (!validatePage(path)) {
                    path = "404";
                }
            }
        }
        return path.replace("/", "");
    };

    // Validates whether the path provide is valid or not.
    var validatePage = function (path) {
        if (path == undefined || !path.length) {
            return false;
        }

        if (path == "index" || path == "contributor") {
            return true;
        }

        var validated = false;
        for (var i in pages) {
            var page = pages[i];
            if (page.children == undefined) {
                continue;
            }

            for (var j in page.children) {
                var p = page.children[j];
                if (p.page != path) {
                    continue;
                }

                validated = true;
                break;
            }

            if (validated) {
                break;
            }
        }
        return validated;
    };

    // Gets the sections.
    var getSections = function() {
        for (var i in pages) {
            var page = pages[i];
            if (page.isParent) {
                var $section = $("<div></div>").attr("id", "section-" + page.page);
                if (page.children != undefined) {
                    for (var j in page.children) {
                        var p = page.children[j];
                        var $page = $("<div></div>").attr("id", "page-" + p.page);
                        $section.append($page);
                    }
                }
                $("#main-content").append($section);
            }
        }
    };

    // Gets the dropdown menu link.
    var getDropdown = function(page) {
        if (page == undefined) {
            return;
        }

        if (page.page == "index" || page.page == "contributor") {
            return;
        }

        if (page.children == undefined) {
            return;
        }

        var $link = $("<a></a>").addClass("dropdown-toggle").attr({ "data-toggle": "dropdown", "href": "#" }).html(page.name + " <strong class=\"caret\"></strong>");

        var $dropdown = $("#dropdown-" + page.page);
        $dropdown.append($link);

        var $ul = $("<ul></ul>").addClass("dropdown-menu");
        for (var i in page.children) {
            var p = page.children[i];
            var $l = $("<a></a>").addClass("internal").attr("href", "#" + p.page).text(p.name);
            var $li = $("<li></li>").append($l);
            $ul.append($li);
        }
        $dropdown.append($ul);
    };

    // Gets the side navigation menus.
    var getSideNavigation = function(page) {
        if (page == undefined) {
            return;
        }

        if (page.page == "index" || page.page == "contributor") {
            return;
        }

        if (page.children == undefined) {
            return;
        }

        var $link = $("<a></a>").attr({ "data-toggle": "collapse", "data-parent": "#accordion", "href": "#" + page.page }).text(page.name);
        var $title = $("<h4></h4>").addClass("panel-title").append($link);
        var $heading = $("<div></div>").addClass("panel-heading").append($title);
        var $panel = $("<div></div>").addClass("panel panel-default").append($heading);

        var $ul = $("<ul></ul>").addClass("nav nav-pills nav-stacked");
        for (var i in page.children) {
            var p = page.children[i];
            var $l = $("<a></a>").addClass("nav-padding-flat internal").attr("href", "#" + p.page).text(p.name);
            var $li = $("<li></li>").attr("id", "nav-" + p.page).append($l);
            $ul.append($li);
        }

        var $body = $("<div></div>").addClass("panel-body").append($ul);
        var $collapsable = $("<div></div>").attr("id", page.page).addClass("panel-collapse collapse").append($body);

        $panel.append($collapsable);
        $("#accordion").append($panel);
    };

    var count = 0;

    // Gets the given markdown page.
    var getMarkdown = function(page, section, total, sha) {
        if (page == undefined) {
            return;
        }

        var url = gitcdn + "/" + sha + "/" + page.doc;
        $.ajax({
                type: "GET",
                url: url,
                dataType: "text"
            })
            .done(function(data) {
                data = marked(data);
                getContents(page, section, data);

                count++;
                getProgressbar((count / total) * 100);

                if ( count/total == 1 ) {
                    processInitialHash();
                }
            });
    };

    // Gets the contents.
    var getContents = function(page, section, data) {
        for (var i in pages) {
            data = data.replace(pages[i].doc, pages[i].page);
        }

        if (section == "index" || page.page == "contributor") {
            $("#main-content #section-" + section).html(data).append($("<hr />"));
        } else {
            $("#main-content #section-" + section + " #page-" + page.page).html(data).append($("<hr />"));
        }

        $("#main-content #section-" + section + " img").addClass("img-responsive");

        $("#main-content #section-" + page.page + " a[href^='#']")
            .addClass("internal")
            .on("click", function() {
                //getPushState(this);
                getScrollTo(this);
                return false;
            });
    };

    // Gets the progress bar.
    var getProgressbar = function (progress) {
        $(".progress-bar").attr("aria-valuenow", progress).css("width", progress + "%");
        if (progress < 100) {
            $("#main-content").hide();
            $("#progress-bar").show();
        } else {
            $("#progress-bar").slideUp("slow", function() {
                $("#main-content").slideDown("slow");
            });
        }
    };

    // Gets the total number of pages.
    var getTotalPages = function() {
        var total = 0;
        for (var i in pages) {
            if (pages[i].page == "index" || pages[i].page == "contributor") {
                total++;
            } else {
                total += pages[i].children.length;
            }
        }
        return total;
    };

    // Puts the hashtag into the pushstate.
    var getPushState = function ($anchor) {
        var hash = "#" + $.url($anchor.attr("href")).attr("fragment");
        history.pushState(null, null, hash);
    };

    // Gets the smooth scroll.
    var getScrollTo = function ($anchor) {
        var fragment = $.url($anchor.attr("href")).attr("fragment");
        var hash = "#page-" + fragment;
        if (fragment == "contributor") {
            hash = hash.replace("#page-", "#section-");
        }
        var left = 0;//$(hash).offset().left * -1;

        $("html, body").scrollTo(hash, 500, { "offset": { "top": -60, "left": left } });
        $("#accordion li").removeClass("active");
        $("#nav-" + fragment).addClass("active");

        location.hash = fragment
    };

    var processInitialHash = function() {
        var interval = setInterval(function() {
            var target = $("a[href=" + location.hash+"]");

            // check DOM rendered successfully
            if ($(document).height() > 20000) {
                getScrollTo(target);
                clearInterval(interval);
            }
        }, 1000);
    }
})(jQuery);
