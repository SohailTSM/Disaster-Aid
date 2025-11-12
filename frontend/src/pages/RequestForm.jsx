import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Alert,
  Grid,
  FormHelperText,
} from '@mui/material';
import { requestService } from '../services/api';

const NEEDS_OPTIONS = [
  { value: 'food', label: 'Food' },
  { value: 'water', label: 'Water' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'medical', label: 'Medical Assistance' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'hygiene', label: 'Hygiene Kits' },
  { value: 'other', label: 'Other' },
];

const requestSchema = yup.object().shape({
  contactName: yup.string().required('Name is required'),
  contactPhone: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .required('Phone number is required'),
  location: yup.string().required('Location is required'),
  beneficiaries: yup
    .number()
    .typeError('Please enter a valid number')
    .positive('Must be a positive number')
    .integer('Must be a whole number')
    .required('Number of beneficiaries is required'),
  needs: yup
    .array()
    .min(1, 'Please select at least one need')
    .required('Please select at least one need'),
  notes: yup.string(),
});

export default function RequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(requestSchema),
    defaultValues: {
      needs: [],
    },
  });

  const selectedNeeds = watch('needs') || [];

  const onSubmit = async (data) => {
    try {
      setError('');
      setLoading(true);
      
      await requestService.createRequest({
        ...data,
        beneficiaries: Number(data.beneficiaries),
      });
      
      setSubmitted(true);
    } catch (err) {
      console.error('Request submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <img
              src="/success-check.png"
              alt="Success"
              style={{ width: 80, height: 80, marginBottom: '1rem' }}
            />
            <Typography variant="h5" gutterBottom>
              Request Submitted Successfully!
            </Typography>
            <Typography color="text.secondary" paragraph>
              Thank you for reaching out. Your request has been received and our team will contact you shortly.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setSubmitted(false)}
          >
            Submit Another Request
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Request for Help
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" align="center" paragraph>
          Please fill out this form to request assistance. Our team will get back to you as soon as possible.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Your Name"
                {...register('contactName')}
                error={!!errors.contactName}
                helperText={errors.contactName?.message}
                margin="normal"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                {...register('contactPhone')}
                error={!!errors.contactPhone}
                helperText={errors.contactPhone?.message || '10-digit phone number'}
                margin="normal"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location / Landmark"
                {...register('location')}
                error={!!errors.location}
                helperText={errors.location?.message}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Beneficiaries"
                {...register('beneficiaries')}
                error={!!errors.beneficiaries}
                helperText={errors.beneficiaries?.message}
                margin="normal"
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                What type of assistance do you need? (Select all that apply) *
              </Typography>
              <FormGroup row>
                {NEEDS_OPTIONS.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        {...register('needs')}
                        value={option.value}
                        checked={selectedNeeds.includes(option.value)}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
              {errors.needs && (
                <FormHelperText error>{errors.needs.message}</FormHelperText>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                {...register('notes')}
                error={!!errors.notes}
                helperText={errors.notes?.message || 'Any additional information that might help us assist you better'}
                margin="normal"
                multiline
                rows={4}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ minWidth: 200, py: 1.5 }}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}
