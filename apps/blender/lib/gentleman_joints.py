"""The Gentleman skeleton: joint positions in the canonical frame (faces +Y, his right = +X,
0.990 tall, centred). Shared by build_gentleman_rig.py and build_mannequin.py."""

# Measured on gentleman_proxy_v02 in the canonical frame (measure_model.py, 2.5% bands):
# ears 0-5%, snout tip y=+0.163 z=0.334, neck z 0.19-0.28 centred y≈+0.03, shoulders widen at
# z≈0.16 to x±0.125, forearms/hooves hang at x±0.13-0.19 from z -0.09 to -0.23, tail
# y -0.07→-0.16 at z -0.09→-0.19, jacket hem z≈-0.21, legs split below z -0.25 at x±0.055,
# knee pushed forward at z≈-0.33, hooves on the floor (z -0.495) with toes at y≈+0.068.
JOINTS = {
    "root":        ((0, 0.000, -0.170), (0, 0.000, -0.120), None, False),
    "hips":        ((0, 0.000, -0.170), (0, 0.005, -0.040), "root", True),
    "spine":       ((0, 0.005, -0.040), (0, 0.010, 0.070), "hips", True),
    "chest":       ((0, 0.010, 0.070), (0, 0.020, 0.185), "spine", True),
    "neck_1":      ((0, 0.020, 0.185), (0, 0.030, 0.240), "chest", True),
    "neck_2":      ((0, 0.030, 0.240), (0, 0.030, 0.295), "neck_1", True),
    "head":        ((0, 0.030, 0.295), (0, 0.020, 0.430), "neck_2", True),
    "snout":       ((0, 0.060, 0.335), (0, 0.163, 0.334), "head", True),
    "ear.R":       ((0.045, 0.025, 0.430), (0.050, 0.030, 0.495), "head", True),
    "ear.L":       ((-0.045, 0.025, 0.430), (-0.050, 0.030, 0.495), "head", True),
    "shoulder.R":  ((0.020, 0.010, 0.160), (0.100, 0.010, 0.150), "chest", True),
    "upper_arm.R": ((0.100, 0.010, 0.150), (0.150, 0.010, -0.030), "shoulder.R", True),
    "forearm.R":   ((0.150, 0.010, -0.030), (0.165, 0.020, -0.170), "upper_arm.R", True),
    "hoof.R":      ((0.165, 0.020, -0.170), (0.155, 0.030, -0.235), "forearm.R", True),
    "shoulder.L":  ((-0.020, 0.010, 0.160), (-0.100, 0.010, 0.150), "chest", True),
    "upper_arm.L": ((-0.100, 0.010, 0.150), (-0.150, 0.010, -0.030), "shoulder.L", True),
    "forearm.L":   ((-0.150, 0.010, -0.030), (-0.165, 0.020, -0.170), "upper_arm.L", True),
    "hoof.L":      ((-0.165, 0.020, -0.170), (-0.155, 0.030, -0.235), "forearm.L", True),
    "thigh.R":     ((0.055, 0.000, -0.170), (0.055, 0.030, -0.330), "hips", True),
    "shin.R":      ((0.055, 0.030, -0.330), (0.055, -0.020, -0.440), "thigh.R", True),
    "foot.R":      ((0.055, -0.020, -0.440), (0.065, 0.068, -0.490), "shin.R", True),
    "thigh.L":     ((-0.055, 0.000, -0.170), (-0.055, 0.030, -0.330), "hips", True),
    "shin.L":      ((-0.055, 0.030, -0.330), (-0.055, -0.020, -0.440), "thigh.L", True),
    "foot.L":      ((-0.055, -0.020, -0.440), (-0.065, 0.068, -0.490), "shin.L", True),
    "tail":        ((0, -0.070, -0.090), (0, -0.160, -0.170), "hips", True),
}
