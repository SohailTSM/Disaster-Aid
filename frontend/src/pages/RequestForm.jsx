import { useState, useEffect } from 'react';
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
    .of(
      yup.object().shape({
        type: yup.string().required(),
        quantity: yup.number().min(0).required('Quantity is required'),
        selected: yup.boolean(),
      })
    )
    .min(1, 'Please select at least one need')
    .test(
      'at-least-one-selected',
      'Please select at least one need',
      (needs) => needs && needs.some((need) => need.selected)
    ),
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
    setValue,
    getValues,
  } = useForm({
    resolver: yupResolver(requestSchema),
    defaultValues: {
      needs: NEEDS_OPTIONS.map((option) => ({
        type: option.value,
        quantity: 0,
        selected: false,
      })),
    },
  });

  const beneficiaries = watch('beneficiaries') || 0;
  const needs = watch('needs') || [];

  const handleNeedToggle = (needType) => {
    const currentNeeds = [...needs];
    const needIndex = currentNeeds.findIndex((n) => n.type === needType);

    if (needIndex !== -1) {
      const newSelected = !currentNeeds[needIndex].selected;
      currentNeeds[needIndex] = {
        ...currentNeeds[needIndex],
        selected: newSelected,
        quantity: newSelected ? beneficiaries : 0,
      };
      setValue('needs', currentNeeds);
    }
  };

  const handleQuantityChange = (needType, value) => {
    const currentNeeds = [...needs];
    const needIndex = currentNeeds.findIndex((n) => n.type === needType);

    if (needIndex !== -1) {
      currentNeeds[needIndex] = {
        ...currentNeeds[needIndex],
        quantity: Math.max(0, parseInt(value) || 0),
      };
      setValue('needs', currentNeeds);
    }
  };

  // Auto-update quantities when beneficiaries change
  useEffect(() => {
    if (beneficiaries > 0) {
      const currentNeeds = [...needs];
      const updatedNeeds = currentNeeds.map((need) => ({
        ...need,
        quantity: need.selected ? beneficiaries : need.quantity,
      }));
      setValue('needs', updatedNeeds);
    }
  }, [beneficiaries]);

  const isNeedSelected = (needType) => {
    const need = needs.find((n) => n.type === needType);
    return need ? need.selected : false;
  };

  const getNeedQuantity = (needType) => {
    const need = needs.find((n) => n.type === needType);
    return need ? need.quantity : 0;
  };

  const onSubmit = async (data) => {
    try {
      setError('');
      setLoading(true);

      // Filter out unselected needs and format the data
      const selectedNeedsData = data.needs
        .filter((need) => need.selected)
        .map(({ type, quantity }) => ({
          type,
          quantity: Number(quantity) || 0,
        }));

      if (selectedNeedsData.length === 0) {
        throw new Error('Please select at least one need');
      }

      await requestService.createRequest({
        ...data,
        beneficiaries: Number(data.beneficiaries),
        needs: selectedNeedsData,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Request submission error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to submit request. Please try again.'
      );
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
              Thank you for reaching out. Your request has been received and our
              team will contact you shortly.
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => setSubmitted(false)}>
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

        <Typography
          variant="subtitle1"
          color="text.secondary"
          align="center"
          paragraph
        >
          Please fill out this form to request assistance. Our team will get back
          to you as soon as possible.
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
                helperText={
                  errors.contactPhone?.message || '10-digit phone number'
                }
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
              <FormGroup>
                {NEEDS_OPTIONS.map((option) => {
                  const isSelected = isNeedSelected(option.value);
                  const quantity = getNeedQuantity(option.value);

                  return (
                    <Box
                      key={option.value}
                      sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleNeedToggle(option.value)}
                          />
                        }
                        label={option.label}
                        sx={{ minWidth: 200, mr: 2 }}
                      />
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', flex: 1 }}
                      >
                        <TextField
                          type="number"
                          size="small"
                          value={quantity}
                          onChange={(e) =>
                            handleQuantityChange(option.value, e.target.value)
                          }
                          disabled={!isSelected}
                          inputProps={{ min: 0, style: { textAlign: 'right' } }}
                          sx={{ width: 100, mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {quantity === 1 ? 'item' : 'items'} per beneficiary
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
                {errors.needs && (
                  <FormHelperText error>
                    {errors.needs.message}
                  </FormHelperText>
                )}
              </FormGroup>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                {...register('notes')}
                multiline
                rows={4}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                fullWidth
                sx={{ mt: 2 }}
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
