import React, { useEffect, useState } from "react";
import axios from "axios";

const WordPressContent = ({ siteUrl, username, appPassword }) => {
  const [pages, setPages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Encode credentials for Basic Auth
  const authHeader = "Basic " + btoa(`${username}:${appPassword}`);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Fetch Pages
        const pagesRes = await axios.get(`${siteUrl}/wp-json/wp/v2/pages`, {
          headers: { Authorization: authHeader },
        });

        // Fetch Posts
        const postsRes = await axios.get(`${siteUrl}/wp-json/wp/v2/posts`, {
          headers: { Authorization: authHeader },
        });

        setPages(pagesRes.data);
        setPosts(postsRes.data);
      } catch (error) {
        console.error("Error fetching WordPress content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [siteUrl, authHeader]);

  if (loading) return <p>Loading WordPress content...</p>;

  return (
    <div>
      <h2>WordPress Site: {siteUrl}</h2>

      <h3>Pages</h3>
      <ul>
        {pages.map((page) => (
          <li key={page.id}>
            <a href={page.link} target="_blank" rel="noopener noreferrer">
              {page.title.rendered}
            </a>
          </li>
        ))}
      </ul>

      <h3>Posts</h3>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <a href={post.link} target="_blank" rel="noopener noreferrer">
              {post.title.rendered}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WordPressContent;
