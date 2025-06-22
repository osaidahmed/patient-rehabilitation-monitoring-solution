"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Square, Camera } from "lucide-react"
import Webcam from 'react-webcam';
import io from 'socket.io-client';
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Progress } from "./components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"

const socket = io('http://localhost:5000');

export default function Component() {
  const webcamRef = useRef(null);
  const [currentAngle, setCurrentAngle] = useState(0)
  const [processedImage, setProcessedImage] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState("")
  const [feedback, setFeedback] = useState("Position your arm and start the session")
  const [reps, setReps] = useState(0)
  const [stage, setStage] = useState("down") // "down" or "up"
  const [duration, setDuration] = useState(0)

  const angleProgress = Math.min((currentAngle / 180) * 100, 100)

  useEffect(() => {
    const handleResponse = (data) => {
      setCurrentAngle(data.angle);
      setProcessedImage(data.image);

      // Rep counting logic
      setStage(prevStage => {
        if (data.angle > 160) {
          return "down";
        }
        if (data.angle < 90 && prevStage === "down") {
          setReps(prevReps => prevReps + 1);
          return "up";
        }
        return prevStage;
      });
    };

    socket.on('response_back', handleResponse);

    return () => {
      socket.off('response_back', handleResponse);
    };
  }, []);

  const capture = () => {
    if (webcamRef.current && selectedExercise) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        socket.emit('frame', { image: imageSrc, exercise: selectedExercise });
      }
    }
  };

  useEffect(() => {
    let interval;
    if (isSessionActive) {
      interval = setInterval(() => {
        capture();
      }, 100); // Send a frame every 100ms
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isSessionActive, selectedExercise]);

  useEffect(() => {
    let timer;
    if (isSessionActive) {
      timer = setInterval(() => {
        setDuration(prevDuration => prevDuration + 1);
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isSessionActive]);


  const handleStartSession = () => {
    setIsSessionActive(true)
    setFeedback("Great! Keep holding that position")
    setReps(0);
    setDuration(0);
  }

  const handleStopSession = () => {
    setIsSessionActive(false)
    setFeedback("Session completed. Great work!")
    setProcessedImage(null); // Clear the image
    setCurrentAngle(0); // Reset angle
    setDuration(0);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Physical Therapy Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your exercise progress in real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Feed (2/3 width) */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Camera className="h-5 w-5" />
                  Live Exercise Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div className="flex items-center justify-center h-full bg-gray-100 rounded-b-lg">
                  {isSessionActive ? (
                     <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {processedImage && (
                          <img
                            src={processedImage}
                            alt="Processed webcam feed"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Camera feed will appear here</p>
                      <p className="text-gray-400 text-sm mt-2">Pose estimation overlay will track your movements</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Control and Data Panel (1/3 width) */}
          <div className="space-y-6">
            {/* Real-time Feedback Card */}
            <Card>
              <CardHeader className="bg-green-50 border-b">
                <CardTitle className="text-green-900">Live Metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-green-600 mb-2">{currentAngle.toFixed(1)}°</div>
                  <p className="text-sm text-gray-600 mb-4">Current Angle</p>
                  <Progress value={angleProgress} className="w-full h-3 mb-4" />
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Feedback</p>
                    <p className="text-blue-700 mt-1">{feedback}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Control Card */}
            <Card>
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="text-blue-900">Session</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <Button
                    onClick={handleStartSession}
                    disabled={isSessionActive || !selectedExercise}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </Button>
                  <Button
                    onClick={handleStopSession}
                    disabled={!isSessionActive}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Session
                  </Button>
                </div>
                {isSessionActive && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-800">Session Active</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exercise Selection Card */}
            <Card>
              <CardHeader className="bg-purple-50 border-b">
                <CardTitle className="text-purple-900">Select Your Exercise</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an exercise..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left-elbow-bend">Left Elbow Bend</SelectItem>
                    <SelectItem value="right-elbow-bend">Right Elbow Bend</SelectItem>
                    <SelectItem value="left-knee-flexion">Left Knee Flexion</SelectItem>
                    <SelectItem value="right-knee-flexion">Right Knee Flexion</SelectItem>
                    <SelectItem value="shoulder-abduction">Shoulder Abduction</SelectItem>
                    <SelectItem value="hip-flexion">Hip Flexion</SelectItem>
                  </SelectContent>
                </Select>
                {selectedExercise && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">Selected Exercise</p>
                    <p className="text-purple-700 capitalize">{selectedExercise.replace("-", " ").replace("-", " ")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Stats Card */}
            <Card>
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-gray-900">Session Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{new Date(duration * 1000).toISOString().substr(14, 5)}</div>
                    <p className="text-sm text-gray-600">Duration</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{reps}</div>
                    <p className="text-sm text-gray-600">Reps</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
