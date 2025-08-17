const apiKey = "3a66d4079187402db3f123dd80110540";
const newsGrid = document.getElementById("newsGrid");
const loading = document.getElementById("loading");
const searchInput = document.getElementById("search");

// Alternative proxy services (try different ones if one doesn't work)
const proxies = [
    "https://cors-anywhere.herokuapp.com/",
    "https://api.allorigins.win/raw?url=",
    "https://thingproxy.freeboard.io/fetch/"
];

let currentProxyIndex = 0;

// Fetch news by category
async function fetchNews(category = "General") {
    newsGrid.innerHTML = "";
    loading.style.display = "block";

    try {
        let url = `https://newsapi.org/v2/top-headlines?country=us&category=${category.toLowerCase()}&apiKey=${apiKey}`;
        let data = await fetchWithProxy(url);

        loading.style.display = "none";

        if (data.status !== "ok" || !data.articles || data.articles.length === 0) {
            showNoResults("No News Found", "Try a different category or search term");
            return;
        }

        displayNews(data.articles);
    } catch (error) {
        loading.style.display = "none";
        console.error("Error fetching news:", error);
        showNoResults("Error Loading News", "Please check your connection and try again");
    }
}

// Search news
async function searchNews() {
    const query = searchInput.value.trim();
    if (!query) {
        fetchNews();
        return;
    }

    newsGrid.innerHTML = "";
    loading.style.display = "block";

    try {
        let url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}&sortBy=publishedAt&pageSize=20`;
        let data = await fetchWithProxy(url);

        loading.style.display = "none";

        if (data.status !== "ok" || !data.articles || data.articles.length === 0) {
            showNoResults("No Results Found", "Try different keywords or check your spelling");
            return;
        }

        displayNews(data.articles);
    } catch (error) {
        loading.style.display = "none";
        console.error("Error searching news:", error);
        showNoResults("Error Loading News", "Please check your connection and try again");
    }
}

// Fetch with proxy fallback
async function fetchWithProxy(url) {
    for (let i = 0; i < proxies.length; i++) {
        try {
            const proxyUrl = proxies[currentProxyIndex] + encodeURIComponent(url);
            console.log(`Trying proxy ${currentProxyIndex + 1}: ${proxies[currentProxyIndex]}`);
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn(`Proxy ${currentProxyIndex + 1} failed:`, error.message);
            currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
            
            if (i === proxies.length - 1) {
                // If all proxies fail, try direct fetch (might work in some environments)
                try {
                    console.log("All proxies failed, trying direct fetch...");
                    const response = await fetch(url);
                    return await response.json();
                } catch (directError) {
                    throw new Error("All proxy attempts failed and direct fetch blocked by CORS");
                }
            }
        }
    }
}

// Display news articles
function displayNews(articles) {
    articles.forEach((article, index) => {
        const card = document.createElement("div");
        card.classList.add("news-card");
        card.style.animationDelay = `${index * 0.1}s`;

        const publishedAt = new Date(article.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Handle missing images
        const imageUrl = article.urlToImage && article.urlToImage !== "" 
            ? article.urlToImage 
            : 'https://via.placeholder.com/400x200/667eea/white?text=News+Image';

        card.innerHTML = `
            <div class="news-image-container">
                <img src="${imageUrl}" alt="News Image" onerror="this.src='https://via.placeholder.com/400x200/667eea/white?text=News+Image'">
                <div class="news-image-overlay"></div>
            </div>
            <div class="news-content">
                <h3>${article.title || "No title available"}</h3>
                <p>${article.description || "No description available."}</p>
                <div class="news-meta">
                    <span class="publish-time">
                        <i class="far fa-clock"></i>
                        ${publishedAt}
                    </span>
                </div>
                <a href="${article.url}" target="_blank" class="read-more">
                    Read Full Article
                    <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `;
        newsGrid.appendChild(card);
    });
}

// Show no results message
function showNoResults(title, message) {
    newsGrid.innerHTML = `
        <div class="no-results">
            <i class="fas fa-newspaper"></i>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
}

// Allow Enter key for search
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchNews();
    }
});

// Category buttons
document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        fetchNews(btn.dataset.category);
    });
});

// Load default news when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure all elements are loaded
    setTimeout(() => {
        fetchNews();
    }, 500);
});

// Live news updates every 5 minutes (reduced from 60 seconds to avoid hitting API limits)
setInterval(() => {
    const activeCategory = document.querySelector(".category-btn.active")?.dataset.category || "General";
    fetchNews(activeCategory);
}, 300000); // 5 minutes