import { WebHeader,header_html } from "../main.js";

// Move the initialization to the HTML file where the script is included.

const blogListPath = "/blog/list.json";

function createBlogListItem(href, heading, publishDate, readTime, author) {
    return `
        <a href="${href}">
            <div id="blog-item" class="blog-item" data-load-content="${href}" >
                <div class="blog-list-box">
                    <div class="blog-heading">${heading}</div>
                    <div class="blog-info">Date: ${publishDate} | Estimated Reading Time: ${readTime} | Author: ${author}</div>
                </div>
            </div>
        </a>

    `;
}

function createBlogPage(content) {
    return `
        <div id="blog-box" class="blog">
            <div class="blog-message"></div>
            <div class="blog-list">
                ${content}
            </div>
        </div>
    `;
}

function createArticlePage(content){
    return `<div class="article" id="article-content">
        ${content}
    </div>`
}

async function loadListData() {
    try {
        const response = await fetch(blogListPath);

        if (!response.ok) {
            throw new Error(`Failed to fetch blog list content. Status: ${response.status}`);
        }

        const blogListContent = await response.json();

        return blogListContent;
    } catch (error) {
        console.error('Error fetching blog list content:', error);
        return null;
    }
}

async function listBlogPageContent() {
    try {
        const blogListContent = await loadListData();

        if (blogListContent !== null) {
            const blogListItems = blogListContent.map(item => createBlogListItem(
                item.path,
                item.Heading,
                item['Generated Date'],
                item.ReadTime,
                item.Author
            ));
            
            const blogPageHTML = createBlogPage(blogListItems.join(''));
            document.getElementById('listblogpage').innerHTML += blogPageHTML;
        }
    } catch (error) {
        console.error('Error in listBlogPageContent:', error);
    }

    window.addEventListener('load', listBlogPageContent);
}

async function load_article_content(article_file_location){

    try{

        var article_content_html = await( await fetch(article_file_location));

        var blog_page_for_article_HTML = createArticlePage(await article_content_html.text());

        return blog_page_for_article_HTML

    }catch(error){
        console.error("Error fetching article content :", error);
    }
}

async function blogPage() {

    await listBlogPageContent();
}

// Call the function to initialize the header generation 
WebHeader("blog");

blogPage();


  