import { useRef, useState } from 'react';
import { Avatar, Box, AppBar, Toolbar, Typography, Button, IconButton, Tooltip, Popover } from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PaletteIcon from '@mui/icons-material/Palette';
import { useAuth0 } from '@auth0/auth0-react';
import palette, { applyCustomAccent, applyTheme, getStoredCustomAccent, getStoredThemeId, getThemeValues, themeOptions } from '../theme/palette';

export default function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [themeAnchor, setThemeAnchor] = useState(null);
  const [selectedThemeId, setSelectedThemeId] = useState(getStoredThemeId());
  const [customAccent, setCustomAccent] = useState(getStoredCustomAccent());
  const customColorRef = useRef(null);
  const userName = user?.name || user?.email || 'Usuario';
  const userInitials = userName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const headerIconSx = {
    width: 34,
    height: 34,
    color: palette.muted,
    border: 'none',
    backgroundColor: palette.overlaySoft,
    '&:hover': {
      color: palette.accent,
      backgroundColor: palette.accentSoft,
    },
  };

  const handleOpenProfile = (event) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleCloseProfile = () => {
    setProfileAnchor(null);
  };

  const handleOpenTheme = (event) => {
    setThemeAnchor(event.currentTarget);
  };

  const handleCloseTheme = () => {
    setThemeAnchor(null);
  };

  const handleSelectTheme = (themeId) => {
    applyTheme(themeId);
    setSelectedThemeId(themeId);
    handleCloseTheme();
  };

  const handleSelectCustomAccent = (event) => {
    const accent = event.target.value;
    setCustomAccent(accent);
    applyCustomAccent(accent);
    setSelectedThemeId('custom');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: palette.bg,
        boxShadow: 'none',
        borderBottom: 'none',
        width: '100%',
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          minHeight: isMobile ? '56px' : '64px',
          px: { xs: 2, md: 3 },
        }}
      >
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Tooltip title="Notificaciones">
              <IconButton size="small" sx={headerIconSx}>
                <NotificationsNoneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ayuda">
              <IconButton size="small" sx={headerIconSx}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Color de resalte">
              <IconButton
                size="small"
                onClick={handleOpenTheme}
                sx={{
                  ...headerIconSx,
                  color: palette.accent,
                  backgroundColor: palette.accentSoft,
                }}
              >
                <PaletteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Popover
              open={Boolean(themeAnchor)}
              anchorEl={themeAnchor}
              onClose={handleCloseTheme}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1.25,
                  p: 1,
                  backgroundColor: palette.surface,
                  color: palette.text,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 2,
                  boxShadow: palette.shadowSoft,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {themeOptions.map((themeOption) => {
                  const values = getThemeValues(themeOption.id);
                  const isSelected = selectedThemeId === themeOption.id;

                  return (
                    <Tooltip key={themeOption.id} title={themeOption.label}>
                      <IconButton
                        size="small"
                        onClick={() => handleSelectTheme(themeOption.id)}
                        sx={{
                          width: 30,
                          height: 30,
                          p: 0.35,
                          border: `1px solid ${isSelected ? values.accent : palette.borderSoft}`,
                          backgroundColor: isSelected ? values.accentSoft : palette.overlaySoft,
                          '&:hover': {
                            backgroundColor: values.accentSoft,
                            borderColor: values.accent,
                          },
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: values.accent,
                            boxShadow: isSelected ? `0 0 0 3px ${values.accentSoft}` : 'none',
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  );
                })}
                <Tooltip title="Color libre">
                  <IconButton
                    size="small"
                    onClick={() => customColorRef.current?.click()}
                    sx={{
                      width: 30,
                      height: 30,
                      p: 0.35,
                      border: `1px solid ${selectedThemeId === 'custom' ? customAccent : palette.borderSoft}`,
                      backgroundColor: selectedThemeId === 'custom' ? getThemeValues('custom').accentSoft : palette.overlaySoft,
                      '&:hover': {
                        backgroundColor: getThemeValues('custom').accentSoft,
                        borderColor: customAccent,
                      },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: `conic-gradient(from 90deg, #ff4d6d, #ffd166, #06d6a0, #4dabf7, #845ef7, #ff4d6d)`,
                        boxShadow: selectedThemeId === 'custom' ? `0 0 0 3px ${getThemeValues('custom').accentSoft}` : 'none',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          inset: 4,
                          borderRadius: '50%',
                          backgroundColor: customAccent,
                        },
                      }}
                    />
                    <Box
                      component="input"
                      ref={customColorRef}
                      type="color"
                      value={customAccent}
                      onChange={handleSelectCustomAccent}
                      sx={{
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        opacity: 0,
                        pointerEvents: 'none',
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            </Popover>
            {!isMobile && (
              <Typography
                sx={{
                  color: palette.text,
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  maxWidth: 220,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userName}
              </Typography>
            )}
            <Tooltip title="Ver perfil">
              <Avatar
                alt={userName}
                onClick={handleOpenProfile}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: palette.accent,
                  color: palette.onAccent,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: `1px solid ${palette.accent}`,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: palette.shadowSoft,
                  },
                }}
              >
                {userInitials || 'U'}
              </Avatar>
            </Tooltip>
            <Popover
              open={Boolean(profileAnchor)}
              anchorEl={profileAnchor}
              onClose={handleCloseProfile}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1.25,
                  width: 240,
                  p: 2,
                  backgroundColor: palette.surface,
                  color: palette.text,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 2,
                  boxShadow: palette.shadowSoft,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={user?.picture}
                  alt={userName}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: palette.accent,
                    color: palette.onAccent,
                    fontSize: '1rem',
                    fontWeight: 700,
                    border: `1px solid ${palette.accent}`,
                  }}
                >
                  {userInitials || 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: palette.text,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {userName}
                  </Typography>
                  <Typography
                    sx={{
                      color: palette.muted,
                      fontSize: '0.74rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.email || ''}
                  </Typography>
                </Box>
              </Box>
            </Popover>
            <IconButton
              size="small"
              onClick={() => logout()}
              sx={{
                color: palette.muted,
                border: `1px solid ${palette.borderSoft}`,
                backgroundColor: palette.overlaySoft,
                '&:hover': {
                  color: palette.accent,
                  backgroundColor: palette.accentSoft,
                  borderColor: palette.accent,
                },
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Button
            variant="outlined"
            onClick={() => loginWithRedirect()}
            sx={{
              color: palette.accent,
              borderColor: palette.accent,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: palette.accent,
                backgroundColor: palette.accentSoft,
              },
            }}
          >
            Ingresar
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
