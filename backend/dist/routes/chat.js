"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const openai_1 = __importDefault(require("openai"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
router.post('/message', auth_1.authMiddleware, [
    (0, express_validator_1.body)('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),
    (0, express_validator_1.body)('context').optional().isObject().withMessage('Context must be an object'),
], (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next((0, errorHandler_1.createError)('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400));
    }
    const { message, context = {} } = req.body;
    const userMessage = await prisma.message.create({
        data: {
            userId: req.user.id,
            content: message,
            type: 'user',
            metadata: { context }
        }
    });
    try {
        const userProfile = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                studentProfile: {
                    include: {
                        skills: true,
                        experiences: true,
                        projects: true,
                        certifications: true,
                        education: true,
                        applications: {
                            include: {
                                job: {
                                    include: {
                                        employer: {
                                            select: { companyName: true }
                                        }
                                    }
                                }
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 5
                        }
                    }
                },
                employerProfile: {
                    include: {
                        jobs: {
                            include: {
                                applications: {
                                    select: { status: true }
                                }
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 5
                        }
                    }
                }
            }
        });
        const recentMessages = await prisma.message.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        const systemPrompt = buildSystemPrompt(userProfile);
        const conversationHistory = recentMessages
            .reverse()
            .slice(-6)
            .map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
                { role: 'user', content: message }
            ],
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
            temperature: 0.7
        });
        const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error generating a response.';
        const aiMessage = await prisma.message.create({
            data: {
                userId: req.user.id,
                content: aiResponse,
                type: 'ai',
                metadata: {
                    model: completion.model,
                    usage: completion.usage,
                    context
                }
            }
        });
        logger_1.default.info(`AI chat interaction: User ${req.user.id} - ${message.substring(0, 50)}...`);
        res.status(200).json({
            status: 'success',
            data: {
                response: aiResponse,
                messageId: aiMessage.id,
                usage: completion.usage
            }
        });
    }
    catch (error) {
        logger_1.default.error('OpenAI API error:', error);
        const fallbackResponse = generateFallbackResponse(message, req.user.role);
        const aiMessage = await prisma.message.create({
            data: {
                userId: req.user.id,
                content: fallbackResponse,
                type: 'ai',
                metadata: { fallback: true, error: error?.message }
            }
        });
        res.status(200).json({
            status: 'success',
            data: {
                response: fallbackResponse,
                messageId: aiMessage.id,
                fallback: true
            }
        });
    }
}));
function buildSystemPrompt(user) {
    const basePrompt = `You are an AI career assistant for Profilytics, a platform connecting students with internship opportunities. You are helpful, professional, and knowledgeable about career development, job search strategies, interview preparation, and skill development.

User Profile:
- Name: ${user.firstName} ${user.lastName}
- Role: ${user.role}
- Email: ${user.email}
`;
    if (user.role === 'STUDENT' && user.studentProfile) {
        const profile = user.studentProfile;
        return basePrompt + `
Student Details:
- University: ${profile.university || 'Not specified'}
- Major: ${profile.major || 'Not specified'}
- Graduation Year: ${profile.graduationYear || 'Not specified'}
- GPA: ${profile.gpa || 'Not specified'}
- Skills: ${profile.skills?.map((s) => s.name).join(', ') || 'None listed'}
- GitHub: ${profile.githubUsername || 'Not provided'}
- LeetCode: ${profile.leetcodeUsername || 'Not provided'}
- Recent Applications: ${profile.applications?.length || 0} applications

Guidelines:
- Provide personalized career advice based on their profile
- Suggest relevant skills to learn based on their major and interests
- Help with interview preparation and resume optimization
- Recommend internship strategies and application tips
- Be encouraging and supportive while being realistic
- If they ask about specific companies or roles, provide relevant insights
- Help them improve their coding profiles and GitHub presence
`;
    }
    else if (user.role === 'EMPLOYER' && user.employerProfile) {
        const profile = user.employerProfile;
        return basePrompt + `
Employer Details:
- Company: ${profile.companyName}
- Industry: ${profile.industry || 'Not specified'}
- Position: ${profile.position || 'Not specified'}
- Active Jobs: ${profile.jobs?.length || 0} jobs posted

Guidelines:
- Help with recruitment strategies and candidate evaluation
- Provide insights on writing effective job descriptions
- Assist with interview questions and candidate assessment
- Suggest ways to attract top talent
- Help with employer branding and company presentation
- Provide market insights about hiring trends
- Assist with candidate communication and feedback
`;
    }
    return basePrompt + `
Guidelines:
- Be helpful and professional
- Provide actionable advice
- Ask clarifying questions when needed
- Keep responses concise but informative
`;
}
function generateFallbackResponse(message, userRole) {
    const messageLower = message.toLowerCase();
    if (messageLower.includes('interview')) {
        return `Here are some key interview tips:

**Preparation:**
- Research the company thoroughly
- Practice common interview questions
- Prepare specific examples using the STAR method
- Review the job description and match your skills

**During the Interview:**
- Arrive early and dress professionally
- Maintain good eye contact and body language
- Ask thoughtful questions about the role and company
- Be specific about your accomplishments

**Technical Interviews:**
- Practice coding problems on platforms like LeetCode
- Explain your thought process clearly
- Test your code and consider edge cases
- Don't be afraid to ask clarifying questions

Would you like me to help you with specific interview questions or provide more detailed guidance on any of these areas?`;
    }
    if (messageLower.includes('resume')) {
        return `Here's how to optimize your resume:

**Structure:**
- Keep it to 1-2 pages maximum
- Use a clean, ATS-friendly format
- Include clear sections: Contact, Summary, Experience, Education, Skills

**Content:**
- Use action verbs (Built, Implemented, Improved, Led)
- Include quantifiable achievements and metrics
- Tailor it to each job application
- Highlight relevant projects and technologies

**Technical Skills:**
- List programming languages and frameworks
- Include relevant tools and technologies
- Mention any certifications or online courses
- Add links to GitHub, portfolio, or LinkedIn

**${userRole === 'STUDENT' ? 'Student-Specific' : 'Professional'} Tips:**
${userRole === 'STUDENT'
            ? '- Include relevant coursework and projects\n- Highlight leadership roles and extracurriculars\n- Mention GPA if 3.5 or higher\n- Include internships and part-time work'
            : '- Focus on leadership and team management\n- Highlight business impact and results\n- Include industry recognition or awards\n- Emphasize strategic thinking and problem-solving'}

Would you like me to review a specific section of your resume or provide more targeted advice?`;
    }
    if (messageLower.includes('skill') || messageLower.includes('learn')) {
        return `Here are some in-demand skills to consider:

**Technical Skills:**
- **Programming:** Python, JavaScript, Java, Go, Rust
- **Web Development:** React, Node.js, TypeScript, Next.js
- **Cloud:** AWS, Azure, Google Cloud, Docker, Kubernetes
- **Data:** SQL, MongoDB, Redis, Data Analysis, Machine Learning
- **DevOps:** CI/CD, Git, Linux, Infrastructure as Code

**Soft Skills:**
- Communication and presentation
- Problem-solving and critical thinking
- Leadership and team collaboration
- Project management
- Adaptability and continuous learning

**Learning Resources:**
- Online platforms: Coursera, edX, Udemy, Pluralsight
- Coding practice: LeetCode, HackerRank, CodeWars
- Project-based learning: Build real applications
- Open source contribution: Contribute to GitHub projects

What specific area interests you most? I can provide a more detailed learning path.`;
    }
    return `I'm here to help with your career development! I can assist with:

- **Interview Preparation:** Practice questions, tips, and strategies
- **Resume Optimization:** Structure, content, and ATS optimization
- **Skill Development:** Learning paths and resources
- **Job Search:** Application strategies and networking
- **Career Planning:** Setting goals and creating roadmaps
- **Industry Insights:** Market trends and opportunities

What specific area would you like to explore? Feel free to ask detailed questions about any career-related topic!`;
}
router.get('/history', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await prisma.message.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
    });
    res.status(200).json({
        status: 'success',
        data: {
            messages: messages.reverse()
        }
    });
}));
router.delete('/history', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res) => {
    await prisma.message.deleteMany({
        where: { userId: req.user.id }
    });
    logger_1.default.info(`Chat history cleared for user: ${req.user.id}`);
    res.status(200).json({
        status: 'success',
        message: 'Chat history cleared successfully'
    });
}));
router.get('/insights', auth_1.authMiddleware, (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    if (req.user.role !== 'STUDENT' || !req.user.studentProfile) {
        return next((0, errorHandler_1.createError)('This feature is only available for students with complete profiles', 403));
    }
    try {
        const profile = req.user.studentProfile;
        const [trendingSkills, marketJobs, userApplications] = await Promise.all([
            prisma.$queryRaw `
        SELECT unnest("requiredSkills") as skill, COUNT(*) as demand
        FROM jobs 
        WHERE "createdAt" >= NOW() - INTERVAL '3 months'
          AND status = 'ACTIVE'
        GROUP BY skill
        ORDER BY demand DESC
        LIMIT 10
      `,
            prisma.job.findMany({
                where: {
                    status: 'ACTIVE',
                    OR: [
                        { requiredSkills: { hasSome: profile.skills?.map((s) => s.name) || [] } },
                        { title: { contains: profile.major, mode: 'insensitive' } }
                    ]
                },
                take: 20
            }),
            prisma.application.findMany({
                where: { studentId: profile.id },
                include: { job: true },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);
        const insights = await generateCareerInsights(profile, trendingSkills, marketJobs, userApplications);
        res.status(200).json({
            status: 'success',
            data: {
                insights
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error generating career insights:', error);
        const fallbackInsights = {
            skillGaps: ['Complete your profile to get personalized insights'],
            careerPath: 'Add more details to your profile for custom career recommendations',
            marketTrends: 'JavaScript, Python, and React continue to be in high demand',
            recommendations: [
                'Complete your student profile',
                'Add your coding platform usernames',
                'Upload your resume',
                'Add your projects and experiences'
            ]
        };
        res.status(200).json({
            status: 'success',
            data: {
                insights: fallbackInsights,
                fallback: true
            }
        });
    }
}));
async function generateCareerInsights(profile, trendingSkills, marketJobs, applications) {
    const userSkills = profile.skills?.map((s) => s.name.toLowerCase()) || [];
    const trending = trendingSkills.map((t) => t.skill.toLowerCase());
    const skillGaps = trending
        .filter(skill => !userSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill)))
        .slice(0, 5);
    const applicationStats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'PENDING').length,
        interviews: applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length,
        accepted: applications.filter(a => a.status === 'ACCEPTED').length
    };
    const successRate = applicationStats.total > 0
        ? ((applicationStats.interviews + applicationStats.accepted) / applicationStats.total) * 100
        : 0;
    const recommendations = [];
    if (skillGaps.length > 0) {
        recommendations.push(`Learn trending skills: ${skillGaps.slice(0, 3).join(', ')}`);
    }
    if (successRate < 20) {
        recommendations.push('Consider improving your resume and cover letter');
        recommendations.push('Practice your interview skills');
    }
    if (!profile.githubUsername) {
        recommendations.push('Add your GitHub profile to showcase your projects');
    }
    if (!profile.leetcodeUsername) {
        recommendations.push('Create a LeetCode profile to demonstrate coding skills');
    }
    return {
        skillGaps,
        marketTrends: `Based on recent job postings, ${trending.slice(0, 3).join(', ')} are in high demand`,
        applicationStats,
        successRate: Math.round(successRate),
        recommendations,
        careerPath: generateCareerPath(profile),
        nextSteps: generateNextSteps(profile, skillGaps)
    };
}
function generateCareerPath(profile) {
    const major = profile.major?.toLowerCase() || '';
    const skills = profile.skills?.map((s) => s.name.toLowerCase()) || [];
    if (major.includes('computer science') || skills.includes('javascript') || skills.includes('python')) {
        return 'Software Engineering → Senior Developer → Tech Lead → Engineering Manager';
    }
    if (major.includes('data') || skills.includes('sql') || skills.includes('python')) {
        return 'Data Analyst → Data Scientist → Senior Data Scientist → Data Science Manager';
    }
    if (major.includes('business') || major.includes('management')) {
        return 'Business Analyst → Product Manager → Senior PM → Director of Product';
    }
    return 'Entry-level → Mid-level → Senior → Leadership roles';
}
function generateNextSteps(profile, skillGaps) {
    const steps = [];
    if (skillGaps.length > 0) {
        steps.push(`Focus on learning ${skillGaps[0]} - it's in high demand`);
    }
    if (!profile.resumeUrl) {
        steps.push('Upload your resume to increase application success rate');
    }
    if (profile.projects?.length < 3) {
        steps.push('Build more projects to showcase your skills');
    }
    if (!profile.portfolioUrl) {
        steps.push('Create a portfolio website to stand out to employers');
    }
    return steps.slice(0, 4);
}
exports.default = router;
//# sourceMappingURL=chat.js.map