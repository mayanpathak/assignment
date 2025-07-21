import User from '../models/User.js';

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      message: 'Profile retrieved successfully',
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve profile' 
    });
  }
};

// Update user preferences
export const updatePreferences = async (req, res) => {
  try {
    const { preferredRole, location, salaryRange } = req.body;
    const userId = req.user._id;

    // Validation
    if (salaryRange && typeof salaryRange === 'object') {
      if (salaryRange.min < 0 || salaryRange.max < 0) {
        return res.status(400).json({ 
          message: 'Salary values cannot be negative' 
        });
      }
      
      if (salaryRange.min > salaryRange.max) {
        return res.status(400).json({ 
          message: 'Minimum salary cannot be greater than maximum salary' 
        });
      }
    }

    // Update user preferences
    const updateData = {};
    if (preferredRole !== undefined) updateData.preferredRole = preferredRole.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (salaryRange !== undefined) updateData.salaryRange = salaryRange;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      message: 'Preferences updated successfully',
      user
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: errorMessages.join(', ') 
      });
    }

    res.status(500).json({ 
      message: 'Failed to update preferences' 
    });
  }
};
