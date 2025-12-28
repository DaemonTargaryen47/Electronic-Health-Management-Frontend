"use client";

import { ThemeContext } from "@/context/ThemeContext";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import { LogOut, User, Building2, Shield, StethoscopeIcon, UserCheck, Calendar, PlusCircle, MessageSquare, Clipboard, FlaskConical } from "lucide-react";
import { isAuthenticated, logoutUser, getCurrentUser, isSynapAIAdminSync, refreshAdminStatus } from "@/services/authService";
import { useRouter } from "next/navigation";
import { getDoctorProfile } from "@/services/doctorService";
import { getMyStaffRoles } from "@/services/hospitalStaffService";
import ChatNotificationBadge from "@/components/chat/ChatNotificationBadge";
import { checkNewTestResults } from '@/services/patientTestService';

const Navbar = () => {
  const { theme, changeTheme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [doctorStatus, setDoctorStatus] = useState(null);
  const [isStaff, setIsStaff] = useState(false);
  const [staffRoles, setStaffRoles] = useState([]);
  const [hasNewTestResults, setHasNewTestResults] = useState(false);
  const [newTestResultsCount, setNewTestResultsCount] = useState(0);
  const router = useRouter();

  const checkAdminStatus = async () => {
    // First use the sync check which uses cache
    const adminStatus = isSynapAIAdminSync();
    setIsAdminUser(adminStatus);
    
    // Then refresh admin status from server if needed
    if (isAuthenticated()) {
      await refreshAdminStatus();
      // Check again after refresh
      setIsAdminUser(isSynapAIAdminSync());
    }
  };

  const checkDoctorStatus = async () => {
    if (!isAuthenticated()) return;
    
    try {
      const response = await getDoctorProfile();
      if (response.success && response.doctor) {
        setIsDoctor(true);
        setDoctorStatus(response.doctor.verification_status);
      }
    } catch (err) {
      // 404 means user is not a doctor, which is fine
      if (err.status !== 404) {
        console.error('Error checking doctor status:', err);
      }
      setIsDoctor(false);
      setDoctorStatus(null);
    }
  };

  const checkStaffStatus = async () => {
    if (!isAuthenticated()) return;
    
    try {
      const response = await getMyStaffRoles();
      if (response.success && response.roles && response.roles.length > 0) {
        setIsStaff(true);
        setStaffRoles(response.roles);
      } else {
        setIsStaff(false);
        setStaffRoles([]);
      }
    } catch (err) {
      console.error('Error checking staff status:', err);
      setIsStaff(false);
      setStaffRoles([]);
    }
  };

  const checkAuth = () => {
    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      
      // Check if the user is an admin
      setIsAdminUser(isSynapAIAdminSync());
      
      // Check if the user is a doctor
      checkDoctorStatus();
      
      // Check if the user is hospital staff
      checkStaffStatus();
    } else {
      setUser(null);
      setIsAdminUser(false);
      setIsDoctor(false);
      setDoctorStatus(null);
      setIsStaff(false);
      setStaffRoles([]);
    }
  };

  // Refresh all user data
  const refreshUserData = async () => {
    console.log('Refreshing user data in Navbar');
    checkAuth();
    await checkAdminStatus();
    await checkDoctorStatus();
    await checkStaffStatus();
  };

  useEffect(() => {
    // Check authentication status when component mounts
    checkAuth();
    
    // Also perform a server-side admin check if needed
    if (isAuthenticated()) {
      checkAdminStatus();
      checkStaffStatus();
      // Check for new test results
      checkForNewTestResults();
      
      // Set up an interval to check periodically (every 5 minutes)
      const testResultsInterval = setInterval(checkForNewTestResults, 5 * 60 * 1000);
      
      return () => {
        // ...existing cleanup code...
        clearInterval(testResultsInterval);
      };
    }
    
    // Add an event listener for storage changes (for multi-tab logout)
    window.addEventListener('storage', checkAuth);
    
    // Listen for admin status changes
    const handleAdminStatusChange = (e) => {
      setIsAdminUser(e.detail.isAdmin);
    };
    
    window.addEventListener('adminStatusChanged', handleAdminStatusChange);
    
    // Listen for login events
    const handleLoginEvent = () => {
      refreshUserData();
    };
    
    window.addEventListener('userLoggedIn', handleLoginEvent);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('adminStatusChanged', handleAdminStatusChange);
      window.removeEventListener('userLoggedIn', handleLoginEvent);
    };
  }, []);

  const checkForNewTestResults = async () => {
    try {
      // Get the last time we checked for results
      const lastChecked = localStorage.getItem('lastTestResultsCheckedAt');
      
      if (!lastChecked) {
        // First time checking, just store current time
        localStorage.setItem('lastTestResultsCheckedAt', new Date().toISOString());
        return;
      }
      
      const result = await checkNewTestResults(lastChecked);
      
      setHasNewTestResults(result.hasNewResults);
      setNewTestResultsCount(result.count);
    } catch (error) {
      console.error('Error checking for new test results:', error);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setIsAdminUser(false);
    setIsDoctor(false);
    setDoctorStatus(null);
    setIsStaff(false);
    setStaffRoles([]);
    router.push('/login');
  };

  return (
    <nav className="navbar min-h-[10vh] border-b border-base-300">
      <div className="flex-1">
        <Link
          href={"/"}
          className="btn btn-ghost text-xl font-bold text-base-content"
        >
          SynapAI
        </Link>
        
        <div className="hidden md:flex ml-6">
          <Link href="/hospitals" className="btn btn-ghost">
            <Building2 size={18} className="mr-2" />
            Hospitals
          </Link>
          
          <Link href="/doctors" className="btn btn-ghost">
            <StethoscopeIcon size={18} className="mr-2" />
            Doctors
          </Link>

          <Link href="/appointments/new" className="btn btn-ghost">
            <PlusCircle size={18} className="mr-2" />
            Create Appointment
          </Link>
          
          {isDoctor && doctorStatus === 'approved' && (
            <Link href="/doctor" className="btn btn-ghost">
              <StethoscopeIcon size={18} className="mr-2" />
              Doctor Dashboard
            </Link>
          )}
          
          {isStaff && (
            <Link href="/staff/dashboard" className="btn btn-ghost">
              <Clipboard size={18} className="mr-2" />
              Staff Portal
            </Link>
          )}
          
          {isAdminUser && (
            <Link href="/admin" className="btn btn-ghost">
              <Shield size={18} className="mr-2" />
              Admin Dashboard
            </Link>
          )}
        </div>
      </div>
      <div className="flex-none">
        <label className="swap swap-rotate">
          <input
            type="checkbox"
            onClick={() => {
              changeTheme(theme === "light" ? "black" : "light");
            }}
          />
          <svg
            className={`swap-on h-6 w-6 fill-current ${
              theme === "light" ? "text-black" : "text-white"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
          </svg>
          <svg
            className={`swap-off h-6 w-6 fill-current ${
              theme === "light" ? "text-black" : "text-white"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
          </svg>
        </label>

        {!user && (
          <Link href={"/login"}>
            <button className="btn btn-ghost ml-4 rounded-lg text-lg font-bold">
              Sign In
            </button>
          </Link>
        )}

        {user && (
          <div className="flex items-center">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost">
                <span className="mr-2 text-base-content">{user.name || user.email}</span>
              </div>
              <ul tabIndex={0} className="menu dropdown-content z-[1] mt-2 w-52 rounded-box bg-base-100 p-2 shadow">
                <li>
                  <Link href="/profile" className="justify-between">
                    <span>Profile</span>
                    <User size={16} />
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard">Dashboard</Link>
                </li>
                {isAuthenticated() && (
                  <li>
                    <Link href="/my-tests" className="relative">
                      <FlaskConical size={18} />
                      My Tests
                      {hasNewTestResults && (
                        <span className="absolute top-0 right-1 badge badge-sm badge-error text-xs">
                          {newTestResultsCount > 9 ? '9+' : newTestResultsCount}
                        </span>
                      )}
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/appointments">
                    <Calendar size={16} className="mr-2" />
                    My Appointments
                  </Link>
                </li>
                
                <li>
                  <Link href="/chats" className="justify-between">
                    <div className="flex items-center">
                      <MessageSquare size={16} className="mr-2" />
                      <span>My Messages</span>
                    </div>
                    <ChatNotificationBadge className="ml-2" />
                  </Link>
                </li>
                
                {/* Hospital Staff related menu items */}
                {isStaff && (
                  <li>
                    <Link href="/staff/dashboard">
                      <Clipboard size={16} className="mr-2" />
                      <span>Staff Dashboard</span>
                    </Link>
                  </li>
                )}
                
                {/* Doctor related menu items */}
                {isDoctor ? (
                  <>
                    <li>
                      <Link href="/profile/doctor">
                        <StethoscopeIcon size={16} className="mr-2" />
                        <span>Doctor Profile</span>
                        {doctorStatus && doctorStatus !== 'approved' && (
                          <span className={`badge badge-xs ${doctorStatus === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                            {doctorStatus}
                          </span>
                        )}
                      </Link>
                    </li>
                    {doctorStatus === 'approved' && (
                      <li>
                        <Link href="/doctor">
                          <StethoscopeIcon size={16} className="mr-2" />
                          <span>Doctor Dashboard</span>
                        </Link>
                      </li>
                    )}
                  </>
                ) : (
                  <li>
                    <Link href="/doctors/register">
                      <StethoscopeIcon size={16} className="mr-2" />
                      <span>Register as Doctor</span>
                    </Link>
                  </li>
                )}

                <li>
                  <Link href="/hospitals">
                    <Building2 size={16} className="mr-2" />
                    Hospitals
                  </Link>
                </li>
                
                {isAdminUser && (
                  <>
                    <li>
                      <Link href="/admin">
                        <Shield size={16} className="mr-2" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/doctor-verification">
                        <UserCheck size={16} className="mr-2" />
                        <span>Doctor Verification</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/hospital-management">
                        <span>Hospital Management</span>
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <button onClick={handleLogout} className="text-error">
                    <span>Logout</span>
                    <LogOut size={16} />
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
    </nav>
  );
};

export default Navbar;
