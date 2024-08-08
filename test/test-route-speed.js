const axios = require('axios');
const cheerio = require('cheerio');

async function fetchResource(url, resourceType = '') {
  try {
    const start = Date.now();
    const response = await axios.get(url);
    const end = Date.now();
    const duration = end - start;

    if (response.status !== 200) {
      console.error(`Failed to fetch ${resourceType} from ${url}: ${response.statusText}`);
      process.exit(1);
    }
    return duration;
  } catch (error) {
    console.error(`Failed to fetch ${resourceType} from ${url}: ${error.message}`);
    process.exit(1);
  }
}

async function testClientBehavior(url, maxResponseTime) {
  // Fetch the main HTML document
  const htmlDuration = await fetchResource(url, 'HTML');

  // Parse the HTML and fetch linked resources (JS, CSS, images)
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const resources = [];

  // Extract all resource links (JS, CSS, images)
  $('script[src], link[rel="stylesheet"], img[src]').each((i, element) => {
    const src = $(element).attr('src') || $(element).attr('href');
    if (src) {
      const resourceUrl = new URL(src, url).href;  // Resolve relative URLs
      const resourceType = element.tagName === 'script' ? 'JS' :
                          element.tagName === 'link' ? 'CSS' : 'Image';
      resources.push({ url: resourceUrl, type: resourceType });
    }
  });

  let TotalDuration = htmlDuration;

  // Fetch all resources and check response times
  for (const resource of resources) {
    const duration = await fetchResource(resource.url, resource.type);
    TotalDuration += duration;
  }

  if (TotalDuration > maxResponseTime) {
    console.error(`Error: Time for ${url} is ${TotalDuration} ms.`);
    process.exit(1);
  }

  console.log(`Success: Time for ${url} is ${TotalDuration} ms.`);
}

const url = 'http://localhost:5500';
const routes = ['/', '/about', '/test', '/pong'];
const maxResponseTime = 1000;

for (const route of routes) {
  testClientBehavior(url + route, maxResponseTime);
}
