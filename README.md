# Patient Rehabilitation Monitoring Solution

## The Problem
Patient adherence to home exercise programs is a critical challenge in physical therapy, with non-compliance rates often exceeding 50%. This failure is typically driven by a lack of feedback, low self-efficacy, and fear of incorrect form. This creates a "diagnostic black hole" for clinicians, who lack objective data on home performance. This tool is designed to bridge that gap.

## Solution
This project is a web-based tool that helps patients perform physical therapy exercises correctly at home. It uses computer vision to analyze a user's webcam feed in real-time, providing immediate feedback on joint angles and counting exercise repetitions to build patient confidence and provide clinicians with actionable data.

## Core Features
Real-Time Pose Estimation: Utilizes MediaPipe to detect and track body landmarks from a live webcam stream.

Joint Angle Calculation: Accurately computes the angle of specific joints (e.g., elbow for bicep curls) to measure exercise form.

Automatic Repetition Counting: A state machine tracks the flexion and extension of the joint to automatically count valid repetitions.

Live Feedback Dashboard: A React-based interface displays the annotated video feed, current joint angle, and rep count to the user.

WebSocket Communication: Employs a low-latency WebSocket connection between the React frontend and Flask backend for data streaming.

## Tech Stack
Frontend: React, JavaScript, Socket.IO Client, TailwindCSS

Backend: Python, Flask, Flask-SocketIO, OpenCV, MediaPipe

## How It Works
The React frontend captures video frames from the user's webcam.

Each frame is sent to the Flask backend over a real-time WebSocket connection.

The backend uses OpenCV and MediaPipe to process the frame, detect pose landmarks, and calculate the relevant joint angle.

This data (landmarks, angle, rep count) is sent back to the frontend.

The React dashboard updates instantly to display the annotated video and metrics, giving the user immediate feedback.
