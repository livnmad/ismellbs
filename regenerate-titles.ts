/**
 * Script to regenerate titles for existing blog posts
 * Run with: npx ts-node regenerate-titles.ts
 */

import elasticsearchClient, { INDEX_NAME } from './server/config/elasticsearch';

// Same title generation logic as in blog.service.ts
function generateTitle(content: string): string {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which',
    'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just'
  ]);

  const cleanContent = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleanContent.split(' ');
  
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    if (word.length > 3 && !stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });

  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  if (topWords.length > 0) {
    const titleWords = topWords.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    
    let title = titleWords.slice(0, 3).join(' • ');
    
    if (title.length > 100) {
      title = titleWords.slice(0, 2).join(' • ');
    }
    
    return title;
  }

  const firstWords = content.split(' ').slice(0, 8).join(' ');
  let fallbackTitle = firstWords.length > 60 
    ? firstWords.substring(0, 60) + '...' 
    : firstWords;
  
  return fallbackTitle || 'Untitled Post';
}

/**
 * Generate a URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 100); // Limit length
}

async function regenerateTitles() {
  try {
    console.log('🔄 Starting title and slug regeneration...');

    // Get all posts
    const response = await elasticsearchClient.search({
      index: INDEX_NAME,
      body: {
        size: 10000,
        query: {
          match_all: {},
        },
      },
    });

    const hits = response.hits.hits;
    console.log(`📝 Found ${hits.length} posts`);

    let updated = 0;
    let skipped = 0;
    const slugCounts = new Map<string, number>();

    for (const hit of hits) {
      const post = hit._source as any;
      const postId = hit._id;

      // Skip if already has a proper title and slug
      if (post.title && post.slug && post.title !== 'Bullshit Alert' && post.title.trim() !== '') {
        skipped++;
        continue;
      }

      // Generate new title if needed
      const newTitle = post.title && post.title !== 'Bullshit Alert' && post.title.trim() !== '' 
        ? post.title 
        : generateTitle(post.content);

      // Generate base slug
      let baseSlug = generateSlug(newTitle);
      
      // Handle duplicates with incremental counter
      let finalSlug = baseSlug;
      const count = slugCounts.get(baseSlug) || 0;
      if (count > 0) {
        finalSlug = `${baseSlug}-${count}`;
      }
      slugCounts.set(baseSlug, count + 1);

      // Update the post
      await elasticsearchClient.update({
        index: INDEX_NAME,
        id: postId as string,
        body: {
          doc: {
            title: newTitle,
            slug: finalSlug,
          },
        },
        refresh: 'wait_for',
      });

      console.log(`✅ Updated post ${postId}: "${newTitle}" -> ${finalSlug}`);
      updated++;
    }

    console.log('\n✨ Title and slug regeneration complete!');
    console.log(`   Updated: ${updated} posts`);
    console.log(`   Skipped: ${skipped} posts (already had titles)`);

  } catch (error) {
    console.error('❌ Error regenerating titles:', error);
    throw error;
  }
}

// Run the script
regenerateTitles()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
  });
