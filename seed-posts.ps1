# PowerShell script to seed blog posts

$API_URL = "http://localhost:3001/api"

$posts = @(
    @{
        content = "Just heard a politician say they 'care about the working class' while voting to cut minimum wage. The audacity!"
        author = "Karen Smith"
        email = "karen@example.com"
        tags = @("politics", "hypocrisy")
    },
    @{
        content = "My boss just told us 'we're a family here' right before announcing no holiday bonuses this year. Sure, Jan."
        author = "Anonymous"
        email = "anonymous@ismellbs.com"
        tags = @("corporate", "workplace")
    },
    @{
        content = "Company email: 'We value work-life balance!' Also company: Schedules mandatory meetings at 7 AM and 6 PM on the same day."
        author = "Bob Johnson"
        email = "bob@example.com"
        tags = @("workplace", "corporate")
    },
    @{
        content = "The weather forecast said 'partly cloudy' and it's been pouring rain all day. I guess my umbrella is just for decoration."
        author = "Sarah Williams"
        email = "sarah@example.com"
        tags = @("weather", "everyday")
    },
    @{
        content = "Ad: 'Lose 30 pounds in 2 weeks without diet or exercise!' Yeah, and I'm the Queen of England. This is peak BS marketing."
        author = "Anonymous"
        email = "anonymous@ismellbs.com"
        tags = @("advertising", "scams")
    },
    @{
        content = "Politician promises to 'drain the swamp' and then immediately hires three lobbyists. You can't make this stuff up!"
        author = "Mike Davis"
        email = "mike@example.com"
        tags = @("politics", "corruption")
    },
    @{
        content = "Social media influencer: 'Just woke up like this!' Posts professionally lit photo with full makeup and hair done. The lies!"
        author = "Jennifer Brown"
        email = "jennifer@example.com"
        tags = @("social-media", "influencers")
    },
    @{
        content = "ISP customer service: 'Your internet will be restored in 24-48 hours.' Day 5 and still nothing. Classic."
        author = "Anonymous"
        email = "anonymous@ismellbs.com"
        tags = @("customer-service", "tech")
    },
    @{
        content = "News headline: 'Millionaire says millennials should just stop buying coffee to afford homes.' Meanwhile, houses cost 10x what they did when he bought his."
        author = "David Wilson"
        email = "david@example.com"
        tags = @("economy", "housing")
    },
    @{
        content = "Gym membership fine print is 3 pages long but canceling requires a blood oath and sacrifice of your firstborn. Total BS!"
        author = "Lisa Garcia"
        email = "lisa@example.com"
        tags = @("contracts", "gym")
    },
    @{
        content = "Boss: 'We don't have budget for raises this year.' Also boss: Just bought a third vacation home. I smell BS."
        author = "Anonymous"
        email = "anonymous@ismellbs.com"
        tags = @("workplace", "inequality")
    },
    @{
        content = "Dating app profile: 'I'm 6 feet tall, successful entrepreneur, love hiking and travel.' Reality: 5'7, unemployed, Netflix on the couch. Why do people lie?!"
        author = "Chris Martinez"
        email = "chris@example.com"
        tags = @("dating", "online")
    },
    @{
        content = "Product packaging: 'New and Improved!' Checked the ingredients - literally the exact same formula. Marketing BS at its finest."
        author = "Emily Rodriguez"
        email = "emily@example.com"
        tags = @("marketing", "products")
    },
    @{
        content = "University: 'We care about student mental health!' Also university: Assigns 5 major projects due the same week as finals."
        author = "Anonymous"
        email = "anonymous@ismellbs.com"
        tags = @("education", "university")
    },
    @{
        content = "Real estate listing: 'Cozy starter home!' Translation: 400 sq ft closet with a toilet for $500k. The housing market is absolute bullshit."
        author = "James Anderson"
        email = "james@example.com"
        tags = @("real-estate", "housing")
    },
    @{
        content = "Celebrity: 'I achieved this body with clean eating and exercise!' Meanwhile they have a personal chef, trainer, and probable plastic surgery. Be real!"
        author = "Mary Taylor"
        email = "mary@example.com"
        tags = @("celebrities", "fitness")
    },
    @{
        content = "Traffic report: 'Light delays expected.' I've been sitting in the same spot for 45 minutes. This is not 'light' anything!"
        author = "Anonymous"
        email = "anonymous@ismellbs.com"
        tags = @("traffic", "commute")
    },
    @{
        content = "Tech company: 'We respect your privacy!' Collects every piece of data imaginable and sells it to advertisers. Yeah, sure you do."
        author = "Robert Thomas"
        email = "robert@example.com"
        tags = @("privacy", "tech", "data")
    },
    @{
        content = "Restaurant menu: 'Market price.' AKA 'We're going to charge you whatever we think we can get away with.' Just tell me the damn price!"
        author = "Karen Smith"
        email = "karen@example.com"
        tags = @("restaurants", "pricing")
    },
    @{
        content = "Streaming service raises prices again while removing content. They want us to pay more for less. That's some premium grade BS right there."
        author = "Anonymous"
        email = "anonymous@ismellbs.com"
        tags = @("streaming", "tech", "pricing")
    }
)

$comments = @(
    "This is so true! I've experienced the exact same thing.",
    "Finally someone said it!",
    "I can't believe this is still happening in 2025.",
    "Preach! 🙌",
    "This makes my blood boil.",
    "Welcome to the real world, folks.",
    "I thought it was just me noticing this BS!",
    "Story of my life right here.",
    "They think we're all stupid or something.",
    "This is why I have trust issues."
)

$names = @(
    "Karen Smith", "Bob Johnson", "Sarah Williams", "Mike Davis", 
    "Jennifer Brown", "David Wilson", "Lisa Garcia", "Chris Martinez",
    "Emily Rodriguez", "James Anderson", "Mary Taylor", "Robert Thomas", "Anonymous"
)

Write-Host "Starting data seeding..." -ForegroundColor Green
Write-Host ""

$postCount = 0
foreach ($post in $posts) {
    try {
        $body = @{
            title = "Bullshit Alert"
            content = $post.content
            author = $post.author
            email = $post.email
            tags = $post.tags
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$API_URL/posts" -Method Post -Body $body -ContentType "application/json"
        $postId = $response.post.id
        $postCount++
        
        Write-Host "✓ Created post by $($post.author)" -ForegroundColor Green
        
        # Add 3-4 comments per post
        $numComments = Get-Random -Minimum 3 -Maximum 5
        for ($i = 0; $i < $numComments; $i++) {
            Start-Sleep -Milliseconds 150
            
            $commentAuthor = Get-Random -InputObject $names
            $commentText = Get-Random -InputObject $comments
            
            $commentBody = @{
                postId = $postId
                content = $commentText
                author = $commentAuthor
            } | ConvertTo-Json
            
            try {
                Invoke-RestMethod -Uri "$API_URL/comments" -Method Post -Body $commentBody -ContentType "application/json" | Out-Null
                Write-Host "  ✓ Added comment by $commentAuthor" -ForegroundColor Cyan
            }
            catch {
                Write-Host "  ✗ Failed to add comment: $_" -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
        Start-Sleep -Milliseconds 600
        
    }
    catch {
        Write-Host "✗ Failed to create post: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Data seeding complete! Created $postCount posts with comments." -ForegroundColor Green
