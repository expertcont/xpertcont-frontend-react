import { useState } from 'react';
import { Avatar, Box, AppBar, Toolbar, Typography, Button, IconButton, Tooltip, Popover } from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAuth0 } from '@auth0/auth0-react';

export default function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const [profileAnchor, setProfileAnchor] = useState(null);
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
    color: 'rgba(255,255,255,0.70)',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.025)',
    '&:hover': {
      color: '#ffffff',
      backgroundColor: 'rgba(56,199,189,0.12)',
    },
  };

  const handleOpenProfile = (event) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleCloseProfile = () => {
    setProfileAnchor(null);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        background: 'transparent',
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
            {!isMobile && (
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.86)',
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
                  bgcolor: 'rgba(56,199,189,0.86)',
                  color: '#062421',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: '1px solid rgba(125,219,211,0.42)',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 0 0 3px rgba(56,199,189,0.13)',
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
                  background: 'linear-gradient(180deg, rgba(20,32,39,0.98) 0%, rgba(12,20,26,0.98) 100%)',
                  color: '#ffffff',
                  border: '1px solid rgba(125,150,164,0.20)',
                  borderRadius: 2,
                  boxShadow: '0 18px 42px rgba(0,0,0,0.35)',
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
                    bgcolor: 'rgba(56,199,189,0.86)',
                    color: '#062421',
                    fontSize: '1rem',
                    fontWeight: 700,
                    border: '1px solid rgba(125,219,211,0.38)',
                  }}
                >
                  {userInitials || 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.94)',
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
                      color: 'rgba(144,164,174,0.92)',
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
                color: 'rgba(255,255,255,0.72)',
                border: '1px solid rgba(139,154,165,0.16)',
                backgroundColor: 'rgba(255,255,255,0.035)',
                '&:hover': {
                  color: '#ffffff',
                  backgroundColor: 'rgba(42,161,152,0.14)',
                  borderColor: 'rgba(42,161,152,0.34)',
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
              color: '#dff7f3',
              borderColor: 'rgba(42,161,152,0.42)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#2aa198',
                backgroundColor: 'rgba(42,161,152,0.12)',
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
