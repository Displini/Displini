import { motion } from "framer-motion";
import { Github, Linkedin } from "lucide-react";
import { colors } from "@/lib/designSystem";

/**
 * Made By section - Team showcase
 * - Large glassmorphism container
 * - Team member cards with social links
 * - Floating animation
 */

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  github?: string;
  linkedin?: string;
  avatar?: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Soulaiman Meskini",
    role: "Founder & Developer",
    bio: "Building Displini to help people stay focused and build better habits.",
    github: "https://github.com/soulaimanmeskini",
    linkedin: "https://www.linkedin.com/in/soulaiman-meskini-822b761a9/",
    avatar: "/images/meettheteam/Meettheteam_Soul.png"
  }
  // Add more team members here as needed
];

export function LandingMadeBy() {
  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Meet the team behind Displini
          </h2>
        </motion.div>

        {/* Large Glassmorphism Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-4 md:p-6 shadow-2xl overflow-hidden max-w-xl mx-auto"
        >
          {/* Team Grid */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative w-full max-w-sm"
              >
                {/* Avatar */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 mx-auto overflow-hidden">
                  <img 
                    src={member.avatar || `https://api.dicebear.com/9.x/personas/svg?seed=male-brown-${encodeURIComponent(member.name)}&gender=male&skinColor=8B4513&hair=short&hairColor=A52A2A&eyes=normal&mouth=smile`}
                    alt={member.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      // Fallback to generated avatar if custom image fails
                      const target = e.target as HTMLImageElement;
                      if (member.avatar) {
                        target.src = `https://api.dicebear.com/9.x/personas/svg?seed=male-brown-${encodeURIComponent(member.name)}&gender=male&skinColor=8B4513&hair=short&hairColor=A52A2A&eyes=normal&mouth=smile`;
                      }
                    }}
                  />
                </div>

                {/* Name */}
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  {member.name}
                </h3>

                {/* Role */}
                <p className="text-sm md:text-base font-medium text-primary dark:text-primary/80 text-center mb-3">
                  {member.role}
                </p>

                {/* Bio */}
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
                  {member.bio}
                </p>

                {/* Social Links */}
                <div className="flex justify-center items-center gap-4">
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/50 dark:hover:bg-gray-600/50 flex items-center justify-center transition-colors"
                      aria-label={`${member.name}'s GitHub`}
                    >
                      <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </a>
                  )}
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/50 dark:hover:bg-gray-600/50 flex items-center justify-center transition-colors"
                      aria-label={`${member.name}'s LinkedIn`}
                    >
                      <Linkedin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State Message (if no team members) */}
          {teamMembers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Team information coming soon...
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

