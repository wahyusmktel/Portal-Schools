"use client";

import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Linkedin, Globe, Mail, Youtube } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { normalizeImageUrl } from "@/lib/image-url";

type SocialLink = {
  label: string;
  value: string;
};

type Employee = {
  id: number;
  name: string;
  role: string;
  biography: string;
  imageUrl: string;
  socialLinks: SocialLink[];
  employmentPeriod: string;
  isActive: boolean;
  sortOrder: number;
};

function getIconForLabel(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("instagram") || normalized.includes("ig")) return Instagram;
  if (normalized.includes("facebook") || normalized.includes("fb")) return Facebook;
  if (normalized.includes("youtube") || normalized.includes("yt")) return Youtube;
  if (normalized.includes("twitter") || normalized.includes("x")) return Twitter;
  if (normalized.includes("linkedin")) return Linkedin;
  if (normalized.includes("email") || normalized.includes("mail")) return Mail;
  return Globe;
}

import type { Variants } from "framer-motion";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export function EmployeeShowcase({ employees }: { employees: Employee[] }) {
  const activeEmployees = employees.filter(e => e.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const inactiveEmployees = employees.filter(e => !e.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="py-20 bg-zinc-50 min-h-screen">
      <div className="container-page">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight">Tenaga Pendidik & Kependidikan</h1>
          <p className="mt-4 text-zinc-600 max-w-2xl mx-auto text-lg">Mengenal lebih dekat para pengabdi yang berdedikasi membangun karakter dan masa depan siswa.</p>
        </motion.div>

        {activeEmployees.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-24">
            {activeEmployees.map((emp, index) => (
              <motion.div
                key={emp.id}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-zinc-100"
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-zinc-100">
                  {emp.imageUrl ? (
                    <Image
                      src={normalizeImageUrl(emp.imageUrl)}
                      alt={emp.name} 
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">No Photo</div>
                  )}
                  {emp.socialLinks && emp.socialLinks.length > 0 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      {emp.socialLinks.map((link, i) => {
                        const Icon = getIconForLabel(link.label);
                        return (
                          <Link 
                            key={i} 
                            href={link.value} 
                            target="_blank"
                            className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-zinc-700 hover:text-rosebrand-600 hover:bg-white shadow-lg transition"
                          >
                            <Icon size={18} />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-black text-xl text-zinc-900 group-hover:text-rosebrand-600 transition-colors">{emp.name}</h3>
                  <p className="text-rosebrand-600 font-bold text-sm mt-1">{emp.role}</p>
                  {emp.biography && (
                    <p className="text-zinc-500 text-sm mt-4 line-clamp-3 leading-relaxed">{emp.biography}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {inactiveEmployees.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="pt-16 border-t border-zinc-200"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-zinc-800">Mereka Yang Pernah Berkontribusi</h2>
              <p className="mt-3 text-zinc-500 max-w-2xl mx-auto">Kami menghargai setiap dedikasi dan ilmu yang telah dibaktikan untuk kemajuan institusi ini.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {inactiveEmployees.map((emp) => (
                <motion.div
                  key={emp.id}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.03 }}
                  className="group flex flex-col items-center"
                >
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-md bg-zinc-200 mb-4 transition duration-500 group-hover:shadow-xl">
                    {emp.imageUrl ? (
                      <div className="relative h-full w-full">
                        <Image
                        src={normalizeImageUrl(emp.imageUrl)}
                        alt={emp.name} 
                        fill
                        sizes="160px"
                        className="object-cover grayscale opacity-80 group-hover:opacity-100 transition-all duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 grayscale">No Photo</div>
                    )}
                  </div>
                  <h3 className="font-bold text-zinc-800 text-center text-sm md:text-base leading-tight">{emp.name}</h3>
                  <p className="text-zinc-500 text-xs text-center mt-1">{emp.role}</p>
                  {emp.employmentPeriod && (
                    <p className="text-rosebrand-600/70 font-semibold text-xs mt-2 bg-rosebrand-50 px-3 py-1 rounded-full">{emp.employmentPeriod}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
