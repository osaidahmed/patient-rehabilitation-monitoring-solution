from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import cv2
import mediapipe as mp
import numpy as np
import base64
from io import BytesIO
from PIL import Image, UnidentifiedImageError
import math
import binascii
import json

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_drawing = mp.solutions.drawing_utils

def calculate_angle(a, b, c):
    a = np.array(a)  # First
    b = np.array(b)  # Mid
    c = np.array(c)  # End

    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)

    if angle > 180.0:
        angle = 360 - angle

    return angle

@socketio.on('frame')
def handle_frame(data):
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            return  # Not a valid JSON string, ignore

    image_data = data.get('image')
    exercise = data.get('exercise')

    if not image_data or ',' not in image_data:
        return

    # Decode the image
    try:
        image_data = image_data.split(",")[1]
        if not image_data:
            return
        decoded_image = base64.b64decode(image_data)
        image = Image.open(BytesIO(decoded_image))
    except (UnidentifiedImageError, IndexError, binascii.Error) as e:
        # Ignore frames that cannot be identified or are malformed
        return

    frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    image_height, image_width, _ = frame.shape

    # Process the image
    results = pose.process(frame)

    angle = 0

    # Display the exercise name on the top-left corner of the frame
    if exercise:
        cv2.putText(frame, f"Exercise: {exercise.replace('-', ' ').title()}", 
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2, cv2.LINE_AA)

    # Calculate angle and draw on frame
    if results.pose_landmarks:
        landmarks = results.pose_landmarks.landmark
        
        try:
            if exercise == 'left-elbow-bend':
                shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
                wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
                angle = calculate_angle(shoulder, elbow, wrist)
                cv2.putText(frame, str(round(angle, 2)), 
                               tuple(np.multiply(elbow, [image_width, image_height]).astype(int)), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            elif exercise == 'right-elbow-bend':
                shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
                elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
                wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
                angle = calculate_angle(shoulder, elbow, wrist)
                cv2.putText(frame, str(round(angle, 2)), 
                               tuple(np.multiply(elbow, [image_width, image_height]).astype(int)), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            elif exercise == 'left-knee-flexion':
                hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
                knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
                ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
                angle = calculate_angle(hip, knee, ankle)
                cv2.putText(frame, str(round(angle, 2)), 
                               tuple(np.multiply(knee, [image_width, image_height]).astype(int)), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            elif exercise == 'right-knee-flexion':
                hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
                knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
                ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
                angle = calculate_angle(hip, knee, ankle)
                cv2.putText(frame, str(round(angle, 2)), 
                               tuple(np.multiply(knee, [image_width, image_height]).astype(int)), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            elif exercise == 'shoulder-abduction':
                hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
                shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
                angle = calculate_angle(hip, shoulder, elbow)
                cv2.putText(frame, str(round(angle, 2)), 
                               tuple(np.multiply(shoulder, [image_width, image_height]).astype(int)), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            elif exercise == 'hip-flexion':
                shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
                knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
                angle = calculate_angle(shoulder, hip, knee)
                cv2.putText(frame, str(round(angle, 2)), 
                               tuple(np.multiply(hip, [image_width, image_height]).astype(int)), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)

        except:
            pass # If landmarks are not visible

        # Draw the landmarks
        mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                                mp_drawing.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=2),
                                mp_drawing.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2)
                                )

    # Encode the frame back to base64
    _, buffer = cv2.imencode('.jpg', frame)
    img_str = base64.b64encode(buffer).decode('utf-8')
    
    # Emit the angle and the processed image
    emit('response_back', {'angle': angle, 'image': 'data:image/jpeg;base64,' + img_str})

@app.route('/')
def index():
    return "Backend is running"

if __name__ == '__main__':
    socketio.run(app, debug=True)
