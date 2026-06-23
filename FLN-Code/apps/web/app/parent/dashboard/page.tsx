'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { jsPDF } from 'jspdf';
import { useAudio } from '../../../lib/useAudio';
import { apiFetch } from '../../../lib/api';

export default function ParentDashboard() {
  const { playClick, playSuccess, playWrong } = useAudio();
  
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [activeChild, setActiveChild] = useState<any>(null);
  
  // Analytics states
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [skillsData, setSkillsData] = useState<any[]>([]);
  const [reportSummary, setReportSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchChildrenList();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      const child = children.find(c => c._id === selectedChildId);
      setActiveChild(child);
      fetchAnalytics(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchChildrenList = async () => {
    setLoading(true);
    const res = await apiFetch('/children');
    setLoading(false);
    if (res.success && res.data) {
      setChildren(res.data);
      if (res.data.length > 0) {
        setSelectedChildId(res.data[0]._id);
      }
    }
  };

  const fetchAnalytics = async (childId: string) => {
    setLoading(true);
    // 1. Weekly activity
    const weeklyRes = await apiFetch(`/analytics/${childId}/weekly`);
    if (weeklyRes.success && weeklyRes.data) {
      setWeeklyData(weeklyRes.data);
    }

    // 2. Skill mastery
    const skillsRes = await apiFetch(`/analytics/${childId}/skills`);
    if (skillsRes.success && skillsRes.data) {
      setSkillsData(skillsRes.data);
    }

    // 3. Report summary
    const reportRes = await apiFetch(`/analytics/${childId}/report`);
    if (reportRes.success && reportRes.data) {
      setReportSummary(reportRes.data);
    }
    setLoading(false);
  };

  const handleGeneratePDF = () => {
    if (!reportSummary) return;
    playClick();
    
    try {
      const doc = new jsPDF();
      const { childName, ageGroup, streakDays, totalStars, totalCoins, totalSessions, averageAccuracy, recentSessions } = reportSummary;
      
      // Title Header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 107, 107); // NumiKids Primary color
      doc.text('NumiKids Report Card', 20, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 20, 32);
      
      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(20, 36, 190, 36);
      
      // Student Details
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text(`Student Name: ${childName}`, 20, 45);
      doc.text(`Age Group: Class ${ageGroup} years`, 20, 52);
      doc.text(`Daily Streak: ${streakDays} days`, 20, 59);
      doc.text(`Total Stars: ${totalStars} stars`, 20, 66);
      
      doc.text(`Sessions Completed: ${totalSessions}`, 120, 45);
      doc.text(`Avg Lesson Accuracy: ${averageAccuracy}%`, 120, 52);
      doc.text(`Total Practice Chest: ${totalCoins} coins`, 120, 59);
      
      // Skills Section
      doc.setFontSize(14);
      doc.setTextColor(78, 205, 196); // Secondary color
      doc.text('Foundational Skill Tree Mastery', 20, 80);
      
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      
      let yOffset = 90;
      doc.text('Skill Category', 20, yOffset);
      doc.text('Mastery Status (%)', 120, yOffset);
      doc.line(20, yOffset + 2, 190, yOffset + 2);
      
      yOffset += 10;
      skillsData.forEach(skill => {
        doc.text(skill.name, 20, yOffset);
        doc.text(`${skill.mastery}%`, 120, yOffset);
        yOffset += 8;
      });

      // Recent Activity Log
      yOffset += 10;
      doc.setFontSize(14);
      doc.setTextColor(78, 205, 196);
      doc.text('Recent Sessions Activity Log', 20, yOffset);
      
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      
      yOffset += 10;
      doc.text('Lesson Adventure Name', 20, yOffset);
      doc.text('Stars', 120, yOffset);
      doc.text('Accuracy', 150, yOffset);
      doc.line(20, yOffset + 2, 190, yOffset + 2);
      
      yOffset += 10;
      recentSessions.forEach((s: any) => {
        doc.text(s.lessonTitle.substring(0, 40), 20, yOffset);
        doc.text(`${s.stars} stars`, 120, yOffset);
        doc.text(`${s.accuracy}%`, 150, yOffset);
        yOffset += 8;
      });

      // Footer disclaimer
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('NumiKids evaluates foundational math skills aligned to CBSE and NCERT Vidya Pravesh frameworks.', 20, 280);
      
      doc.save(`${childName}_NumiKids_Report.pdf`);
      playSuccess();
    } catch (e) {
      playWrong();
      alert('Error generating PDF report: ' + e);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[350px]">
        <p className="text-slate-400 font-semibold animate-pulse">Loading dashboard reports...</p>
      </div>
    );
  }

  if (children.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-card border p-8 text-center max-w-md mx-auto">
        <span className="text-6xl block">👦</span>
        <h3 className="text-xl font-bold text-slate-800 mt-4">No child profiles found</h3>
        <p className="text-slate-500 mb-6 mt-1">Create child profiles to begin tracking math progress!</p>
        <Link href="/parent/children">
          <button className="px-6 py-3 bg-brand-primary text-white font-bold rounded-btn min-h-[48px]">
            Add Child Profile ➕
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-parent text-slate-800">
      
      {/* Selector & PDF download header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-card border shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Child</label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-4 py-2 border rounded-btn bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {children.map(c => (
              <option key={c._id} value={c._id}>{c.name} (Class {c.ageGroup})</option>
            ))}
          </select>
        </div>

        {reportSummary && (
          <button
            onClick={handleGeneratePDF}
            className="px-5 py-2.5 bg-brand-secondary text-white font-bold rounded-btn shadow hover:opacity-90 transition text-sm flex items-center gap-1.5 min-h-[46px]"
          >
            <span>📥</span> Download PDF Progress Report
          </button>
        )}
      </div>

      {/* Numerical Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-card border shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Completed Lessons</p>
          <h3 className="text-3xl font-black text-brand-primary">{reportSummary?.totalSessions || 0}</h3>
        </div>
        <div className="bg-white p-4 rounded-card border shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stars Collected</p>
          <h3 className="text-3xl font-black text-brand-primary">⭐ {reportSummary?.totalStars || 0}</h3>
        </div>
        <div className="bg-white p-4 rounded-card border shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Average Accuracy</p>
          <h3 className="text-3xl font-black text-brand-primary">{reportSummary?.averageAccuracy || 0}%</h3>
        </div>
        <div className="bg-white p-4 rounded-card border shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Login Streak</p>
          <h3 className="text-3xl font-black text-orange-500">🔥 {reportSummary?.streakDays || 0} Days</h3>
        </div>
      </div>

      {/* Analytics Charts Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Activity Bar Chart */}
        <div className="bg-white p-6 rounded-card border shadow-sm min-h-[350px] flex flex-col justify-between">
          <h4 className="font-bold text-base text-slate-700 mb-4">Weekly Practice Activity</h4>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#FF6B6B" radius={[4, 4, 0, 0]} name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-semibold">Tells you how many math play sessions occurred per day.</p>
        </div>

        {/* Skill Mastery Radar/Bar Chart */}
        <div className="bg-white p-6 rounded-card border shadow-sm min-h-[350px] flex flex-col justify-between">
          <h4 className="font-bold text-base text-slate-700 mb-4">FLN Numeracy Skill Mastery (%)</h4>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Mastery" dataKey="mastery" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-semibold">Shows the mastery percentage of the child based on graph DAG evaluation.</p>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white p-6 rounded-card border shadow-sm">
        <h4 className="font-bold text-base text-slate-700 mb-4">Recent Sessions History Log</h4>
        
        {reportSummary?.recentSessions?.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No session logs recorded yet. Let's play some lessons!</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="py-2.5">Adventure Name</th>
                  <th className="py-2.5">Stars</th>
                  <th className="py-2.5">Accuracy</th>
                  <th className="py-2.5">Date Completed</th>
                </tr>
              </thead>
              <tbody>
                {reportSummary?.recentSessions?.map((session: any, index: number) => (
                  <tr key={index} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="py-3 font-semibold text-slate-800">{session.lessonTitle}</td>
                    <td className="py-3 text-brand-warning">{'⭐'.repeat(session.stars)}</td>
                    <td className="py-3 font-mono font-bold text-brand-secondary">{session.accuracy}%</td>
                    <td className="py-3 text-slate-500 font-medium">
                      {new Date(session.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
